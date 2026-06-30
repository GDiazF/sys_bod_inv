import { useMemo } from 'react'
import { DataView, ScrollableTable, type DataTableColumn } from '@/components/data'
import {
  DocInfoItem,
  DocInfoStrip,
  DocLayout,
  DocMetaItem,
  DocMetaRow,
  DocSummary,
  DocSummaryItem,
  FormField,
  FormSection,
  QtyControl,
} from '@/components/document'
import { PageHeader } from '@/components/layout'
import {
  Alert,
  Badge,
  Button,
  Input,
  Label,
  Panel,
  PanelHeader,
  PanelTitle,
  Select,
  Textarea,
} from '@/components/ui'
import { DOCUMENT_UI } from '@/config/document-ui'
import { DATA_UI } from '@/config/data-ui'
import { ROUTE_PAGE_META } from '@/config/chrome'
import { useAjusteDocument } from '@/hooks/useAjusteDocument'
import {
  AJUSTE_DIFFERENCE_TYPE_LABELS,
  computeAjusteTotals,
  computeLineDifference,
  deriveAjusteDifferenceType,
  deriveAjusteLineStatus,
  formatAjusteDifference,
  resolveAjusteAdjustTypeLabel,
  resolveWarehouseLabel,
  type AjusteLine,
} from '@/mocks/documents/ajuste'
import {
  DOCUMENT_LINE_STATUS_BADGES,
  DOCUMENT_STATUS_BADGES,
} from '@/mocks/documents/types'
import { formatStockNumber } from '@/mocks/status-labels'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'
import { cn } from '@/lib/cn'

const UI = DOCUMENT_UI.ajuste

function differenceTypeBadgeVariant(type: ReturnType<typeof deriveAjusteDifferenceType>) {
  if (type === 'sobrante') {
    return 'success' as const
  }
  if (type === 'faltante') {
    return 'danger' as const
  }
  return 'neutral' as const
}

export function AjustePage() {
  const meta = ROUTE_PAGE_META.ajuste
  const {
    status,
    document,
    setDocument,
    refetch,
    saveDraft,
    confirmDocument,
    isSaving,
    isConfirming,
    isReadOnly,
  } = useAjusteDocument()

  const totals = useMemo(
    () => (document ? computeAjusteTotals(document.lines) : null),
    [document],
  )

  const columns = useMemo<DataTableColumn<AjusteLine>[]>(
    () => [
      { id: 'line', header: UI.columns.line, mono: true, cell: (row) => row.lineNumber },
      { id: 'sku', header: UI.columns.sku, mono: true, cell: (row) => row.sku },
      { id: 'description', header: UI.columns.description, cell: (row) => row.description },
      {
        id: 'theoretical',
        header: UI.columns.theoretical,
        mono: true,
        cell: (row) => formatStockNumber(row.theoreticalStock),
      },
      {
        id: 'physical',
        header: UI.columns.physical,
        cell: (row) => (
          <QtyControl
            value={row.physicalStock}
            disabled={isReadOnly || isSaving || isConfirming}
            aria-label={`Stock físico línea ${row.lineNumber}`}
            onChange={(physicalStock) => {
              setDocument((current) => {
                if (!current) {
                  return current
                }
                return {
                  ...current,
                  lines: current.lines.map((line) =>
                    line.id === row.id
                      ? {
                          ...line,
                          physicalStock,
                          lineStatus: deriveAjusteLineStatus(line.theoreticalStock, physicalStock),
                        }
                      : line,
                  ),
                }
              })
            }}
          />
        ),
      },
      {
        id: 'difference',
        header: UI.columns.difference,
        mono: true,
        cell: (row) => {
          const difference = computeLineDifference(row)
          return (
            <span
              className={cn(
                difference < 0 && 'text-danger',
                difference > 0 && 'text-accent',
              )}
            >
              {formatAjusteDifference(difference)}
            </span>
          )
        },
      },
      {
        id: 'differenceType',
        header: UI.columns.differenceType,
        cell: (row) => {
          const differenceType = deriveAjusteDifferenceType(computeLineDifference(row))
          return (
            <Badge variant={differenceTypeBadgeVariant(differenceType)}>
              {AJUSTE_DIFFERENCE_TYPE_LABELS[differenceType]}
            </Badge>
          )
        },
      },
      {
        id: 'location',
        header: UI.columns.location,
        mono: true,
        cell: (row) => row.location,
      },
      {
        id: 'lineStatus',
        header: UI.columns.status,
        cell: (row) => {
          const badge = DOCUMENT_LINE_STATUS_BADGES[row.lineStatus]
          return <Badge variant={badge.variant}>{badge.label}</Badge>
        },
      },
    ],
    [isConfirming, isReadOnly, isSaving, setDocument],
  )

  const headerBadge = document
    ? DOCUMENT_STATUS_BADGES[document.header.status]
    : DOCUMENT_STATUS_BADGES.borrador

  const actionsBusy = isSaving || isConfirming

  const adjustTypeLabel = document
    ? resolveAjusteAdjustTypeLabel(document.header.adjustType, document.header.adjustTypeOptions)
    : '—'

  const warehouseLabel = document
    ? resolveWarehouseLabel(document.header.warehouse, document.header.warehouseOptions)
    : '—'

  const showApprovalAlert =
    document?.header.status === 'revision' ||
    document?.lines.some((line) => line.lineStatus === 'revision')

  const documentActions = (
    <>
      <Badge variant={headerBadge.variant}>{headerBadge.label}</Badge>
      <Button variant="ghost" size="sm" disabled>
        {UI.void}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={isReadOnly || actionsBusy || status !== 'success'}
        loading={isSaving}
        onClick={() => void saveDraft()}
      >
        {isSaving ? UI.saving : UI.saveDraft}
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={isReadOnly || actionsBusy || status !== 'success'}
        loading={isConfirming}
        onClick={() => void confirmDocument()}
      >
        {isConfirming ? UI.confirming : UI.confirm}
      </Button>
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={pageBreadcrumbs(meta.breadcrumbLabel)}
        eyebrow={meta.eyebrow}
        title={document?.header.code ?? meta.title}
        actions={documentActions}
      />

      <DataView
        status={status}
        loading={{ label: UI.loading }}
        error={{
          title: UI.errorTitle,
          description: UI.errorDescription,
          onRetry: refetch,
          retryLabel: DATA_UI.dataView.retry,
        }}
      >
        {document ? (
          <DocLayout>
            {showApprovalAlert ? (
              <Alert variant="warn" title={UI.approvalAlertTitle}>
                {UI.approvalAlertMessage}
              </Alert>
            ) : null}

            <DocInfoStrip>
              <DocInfoItem label={UI.strip.adjustType} value={adjustTypeLabel} />
              <DocInfoItem label={UI.strip.warehouse} value={warehouseLabel} />
              <DocInfoItem label={UI.strip.date} value={document.header.date} mono />
              <DocInfoItem label={UI.strip.countRef} value={document.header.countRef} mono />
            </DocInfoStrip>

            <FormSection title={UI.headerTitle} zone={UI.headerZone}>
              <div className="bx-doc-header-grid">
                <FormField>
                  <Label htmlFor="aju-warehouse">{UI.fields.warehouse}</Label>
                  <Select
                    id="aju-warehouse"
                    value={document.header.warehouse}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, warehouse: event.target.value },
                            }
                          : current,
                      )
                    }
                  >
                    {document.header.warehouseOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label required htmlFor="aju-type">
                    {UI.fields.adjustType}
                  </Label>
                  <Select
                    id="aju-type"
                    value={document.header.adjustType}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: {
                                ...current.header,
                                adjustType: event.target.value as typeof document.header.adjustType,
                              },
                            }
                          : current,
                      )
                    }
                  >
                    {document.header.adjustTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label required htmlFor="aju-reason">
                    {UI.fields.reason}
                  </Label>
                  <Select
                    id="aju-reason"
                    value={document.header.reason}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, reason: event.target.value },
                            }
                          : current,
                      )
                    }
                  >
                    {document.header.reasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label required htmlFor="aju-date">
                    {UI.fields.date}
                  </Label>
                  <Input
                    id="aju-date"
                    type="date"
                    value={document.header.date}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, date: event.target.value },
                            }
                          : current,
                      )
                    }
                  />
                </FormField>
              </div>
              <FormField>
                <Label htmlFor="aju-notes">{UI.fields.notes}</Label>
                <Textarea
                  id="aju-notes"
                  placeholder={UI.fields.notesPlaceholder}
                  value={document.header.notes}
                  disabled={isReadOnly || actionsBusy}
                  onChange={(event) =>
                    setDocument((current) =>
                      current
                        ? {
                            ...current,
                            header: { ...current.header, notes: event.target.value },
                          }
                        : current,
                    )
                  }
                />
              </FormField>
            </FormSection>

            <Panel className="overflow-hidden">
              <PanelHeader
                actions={
                  <Button variant="secondary" size="sm" disabled>
                    + {UI.addLine}
                  </Button>
                }
              >
                <PanelTitle zone={UI.linesZone}>{UI.linesTitle}</PanelTitle>
              </PanelHeader>
              <ScrollableTable
                flush
                height="doc"
                columns={columns}
                rows={document.lines}
                rowKey={(row) => row.id}
                caption={UI.linesCaption}
              />
              {totals ? (
                <DocMetaRow>
                  <DocMetaItem label={UI.summary.lines} value={totals.lineCount} />
                  <DocMetaItem
                    label={UI.summary.totalDifference}
                    value={formatAjusteDifference(totals.totalDifference)}
                    mono
                  />
                  <DocMetaItem label={UI.summary.operator} value={document.header.operator} />
                </DocMetaRow>
              ) : null}
            </Panel>

            {totals ? (
              <DocSummary>
                <DocSummaryItem label={UI.summary.lines} value={totals.lineCount} />
                <DocSummaryItem
                  label={UI.summary.adjusted}
                  value={formatStockNumber(totals.adjustedUnits)}
                />
                <DocSummaryItem
                  label={UI.summary.totalDifference}
                  value={formatAjusteDifference(totals.totalDifference)}
                />
                <DocSummaryItem label={UI.summary.differences} value={totals.withDifference} />
                <DocSummaryItem label={UI.summary.operator} value={document.header.operator} />
              </DocSummary>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" disabled={actionsBusy}>
                {UI.cancel}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isReadOnly || actionsBusy}
                loading={isSaving}
                onClick={() => void saveDraft()}
              >
                {isSaving ? UI.saving : UI.saveDraft}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isReadOnly || actionsBusy}
                loading={isConfirming}
                onClick={() => void confirmDocument()}
              >
                {isConfirming ? UI.confirming : UI.confirm}
              </Button>
            </div>
          </DocLayout>
        ) : null}
      </DataView>
    </div>
  )
}
