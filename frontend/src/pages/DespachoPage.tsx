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
import { useDespachoDocument } from '@/hooks/useDespachoDocument'
import {
  computeDespachoTotals,
  deriveDespachoLineStatus,
  type DespachoLine,
} from '@/mocks/documents/despacho'
import {
  DOCUMENT_LINE_STATUS_BADGES,
  DOCUMENT_STATUS_BADGES,
} from '@/mocks/documents/types'
import { formatStockNumber } from '@/mocks/status-labels'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

const UI = DOCUMENT_UI.despacho

export function DespachoPage() {
  const meta = ROUTE_PAGE_META.despacho
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
  } = useDespachoDocument()

  const totals = useMemo(
    () => (document ? computeDespachoTotals(document.lines) : null),
    [document],
  )

  const columns = useMemo<DataTableColumn<DespachoLine>[]>(
    () => [
      { id: 'line', header: UI.columns.line, mono: true, cell: (row) => row.lineNumber },
      { id: 'sku', header: UI.columns.sku, mono: true, cell: (row) => row.sku },
      { id: 'description', header: UI.columns.description, cell: (row) => row.description },
      {
        id: 'committed',
        header: UI.columns.committed,
        mono: true,
        cell: (row) => formatStockNumber(row.committedQty),
      },
      {
        id: 'dispatch',
        header: UI.columns.dispatch,
        cell: (row) => (
          <QtyControl
            value={row.dispatchQty}
            max={row.committedQty}
            disabled={isReadOnly || isSaving || isConfirming}
            aria-label={`Cantidad a despachar línea ${row.lineNumber}`}
            onChange={(dispatchQty) => {
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
                          dispatchQty,
                          lineStatus: deriveDespachoLineStatus(line.committedQty, dispatchQty),
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
        id: 'lineStatus',
        header: UI.columns.status,
        cell: (row) => {
          const badge = DOCUMENT_LINE_STATUS_BADGES[row.lineStatus]
          return <Badge variant={badge.variant}>{badge.label}</Badge>
        },
      },
      {
        id: 'location',
        header: UI.columns.location,
        cell: (row) => (
          <Select
            value={row.location}
            disabled={isReadOnly || isSaving || isConfirming}
            aria-label={`Ubicación línea ${row.lineNumber}`}
            onChange={(event) => {
              const location = event.target.value
              setDocument((current) => {
                if (!current) {
                  return current
                }
                return {
                  ...current,
                  lines: current.lines.map((line) =>
                    line.id === row.id ? { ...line, location } : line,
                  ),
                }
              })
            }}
          >
            {row.locationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ),
      },
    ],
    [isConfirming, isReadOnly, isSaving, setDocument],
  )

  const headerBadge = document
    ? DOCUMENT_STATUS_BADGES[document.header.status]
    : DOCUMENT_STATUS_BADGES.borrador

  const warehouseLabel = document
    ? (document.header.warehouseOptions.find((option) => option.value === document.header.warehouse)
        ?.label ?? document.header.warehouse)
    : '—'

  const actionsBusy = isSaving || isConfirming

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
            <DocInfoStrip>
              <DocInfoItem label={UI.strip.client} value={document.header.client} />
              <DocInfoItem label={UI.strip.warehouse} value={warehouseLabel} />
              <DocInfoItem label={UI.strip.orderRef} value={document.header.orderRef} mono />
              <DocInfoItem label={UI.strip.date} value={document.header.date} mono />
            </DocInfoStrip>

            <FormSection title={UI.headerTitle} zone={UI.headerZone}>
              <div className="bx-doc-header-grid">
                <FormField>
                  <Label required htmlFor="des-client">
                    {UI.fields.client}
                  </Label>
                  <Input
                    id="des-client"
                    value={document.header.client}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, client: event.target.value },
                            }
                          : current,
                      )
                    }
                  />
                </FormField>
                <FormField>
                  <Label required htmlFor="des-order">
                    {UI.fields.orderRef}
                  </Label>
                  <Input
                    id="des-order"
                    className="font-mono"
                    value={document.header.orderRef}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, orderRef: event.target.value },
                            }
                          : current,
                      )
                    }
                  />
                </FormField>
                <FormField>
                  <Label required htmlFor="des-date">
                    {UI.fields.date}
                  </Label>
                  <Input
                    id="des-date"
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
                <FormField>
                  <Label htmlFor="des-warehouse">{UI.fields.warehouse}</Label>
                  <Select
                    id="des-warehouse"
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
              </div>
              <div className="bx-doc-header-grid">
                <FormField>
                  <Label htmlFor="des-carrier">{UI.fields.carrier}</Label>
                  <Select
                    id="des-carrier"
                    value={document.header.carrier}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, carrier: event.target.value },
                            }
                          : current,
                      )
                    }
                  >
                    {document.header.carrierOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <FormField>
                <Label htmlFor="des-notes">{UI.fields.notes}</Label>
                <Textarea
                  id="des-notes"
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
                    label={UI.summary.dispatched}
                    value={formatStockNumber(totals.dispatchUnits)}
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
                  label={UI.summary.committed}
                  value={formatStockNumber(totals.committedUnits)}
                />
                <DocSummaryItem
                  label={UI.summary.dispatched}
                  value={formatStockNumber(totals.dispatchUnits)}
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
