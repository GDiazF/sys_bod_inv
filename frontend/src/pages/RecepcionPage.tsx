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
import { useRecepcionDocument } from '@/hooks/useRecepcionDocument'
import {
  computeRecepcionTotals,
  deriveLineStatus,
  type RecepcionLine,
} from '@/mocks/documents/recepcion'
import {
  DOCUMENT_LINE_STATUS_BADGES,
  DOCUMENT_STATUS_BADGES,
} from '@/mocks/documents/types'
import { formatStockNumber } from '@/mocks/status-labels'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

const UI = DOCUMENT_UI.recepcion

export function RecepcionPage() {
  const meta = ROUTE_PAGE_META.recepcion
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
    actionError,
  } = useRecepcionDocument()

  const totals = useMemo(
    () => (document ? computeRecepcionTotals(document.lines) : null),
    [document],
  )

  const columns = useMemo<DataTableColumn<RecepcionLine>[]>(
    () => [
      { id: 'line', header: UI.columns.line, mono: true, cell: (row) => row.lineNumber },
      { id: 'sku', header: UI.columns.sku, mono: true, cell: (row) => row.sku },
      {
        id: 'description',
        header: UI.columns.description,
        cell: (row) => row.description,
      },
      {
        id: 'expected',
        header: UI.columns.expected,
        mono: true,
        cell: (row) => formatStockNumber(row.expectedQty),
      },
      {
        id: 'received',
        header: UI.columns.received,
        cell: (row) => (
          <QtyControl
            value={row.receivedQty}
            disabled={isReadOnly || isSaving || isConfirming}
            aria-label={`Cantidad recibida línea ${row.lineNumber}`}
            onChange={(receivedQty) => {
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
                          receivedQty,
                          lineStatus: deriveLineStatus(line.expectedQty, receivedQty),
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
      {
        id: 'batch',
        header: UI.columns.batch,
        cell: (row) => (
          <Input
            value={row.batch}
            disabled={isReadOnly || isSaving || isConfirming}
            className="!w-[110px] font-mono text-xs"
            placeholder="—"
            aria-label={`Lote línea ${row.lineNumber}`}
            onChange={(event) => {
              const batch = event.target.value
              setDocument((current) => {
                if (!current) {
                  return current
                }
                return {
                  ...current,
                  lines: current.lines.map((line) =>
                    line.id === row.id ? { ...line, batch } : line,
                  ),
                }
              })
            }}
          />
        ),
      },
    ],
    [isConfirming, isReadOnly, isSaving, setDocument],
  )

  const headerBadge = document
    ? DOCUMENT_STATUS_BADGES[document.header.status]
    : DOCUMENT_STATUS_BADGES.borrador

  const supplierLabel = document
    ? (document.header.supplierOptions.find((option) => option.value === document.header.supplier)
        ?.label ?? document.header.supplier)
    : '—'

  const warehouseLabel = document
    ? (document.header.warehouseOptions.find((option) => option.value === document.header.warehouse)
        ?.label ?? document.header.warehouse)
    : '—'

  const actionsBusy = isSaving || isConfirming

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={pageBreadcrumbs(meta.breadcrumbLabel)}
        eyebrow={meta.eyebrow}
        title={document?.header.code ?? meta.title}
        actions={
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
        }
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
        empty={{
          title: UI.emptyTitle,
          description: UI.emptyDescription,
        }}
      >
        {document ? (
          <DocLayout>
            {actionError ? (
              <p className="text-sm text-[var(--color-danger)]">{actionError}</p>
            ) : null}
            <DocInfoStrip>
              <DocInfoItem label={UI.strip.date} value={document.header.date} mono />
              <DocInfoItem label={UI.strip.supplier} value={supplierLabel} />
              <DocInfoItem label={UI.strip.warehouse} value={warehouseLabel} />
              <DocInfoItem label={UI.strip.purchaseOrder} value={document.header.purchaseOrder} mono />
            </DocInfoStrip>

            <FormSection title={UI.headerTitle} zone={UI.headerZone}>
              <div className="bx-doc-header-grid">
                <FormField>
                  <Label required htmlFor="rec-supplier">
                    {UI.fields.supplier}
                  </Label>
                  <Select
                    id="rec-supplier"
                    value={document.header.supplier}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, supplier: event.target.value },
                            }
                          : current,
                      )
                    }
                  >
                    {document.header.supplierOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label required htmlFor="rec-po">
                    {UI.fields.purchaseOrder}
                  </Label>
                  <Input
                    id="rec-po"
                    className="font-mono"
                    value={document.header.purchaseOrder}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, purchaseOrder: event.target.value },
                            }
                          : current,
                      )
                    }
                  />
                </FormField>
                <FormField>
                  <Label required htmlFor="rec-date">
                    {UI.fields.date}
                  </Label>
                  <Input
                    id="rec-date"
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
                  <Label htmlFor="rec-warehouse">{UI.fields.warehouse}</Label>
                  <Select
                    id="rec-warehouse"
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
              <FormField>
                <Label htmlFor="rec-notes">{UI.fields.notes}</Label>
                <Textarea
                  id="rec-notes"
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
                  <DocMetaItem label={UI.summary.units} value={formatStockNumber(totals.totalUnits)} mono />
                  <DocMetaItem label={UI.summary.operator} value={document.header.operator} />
                </DocMetaRow>
              ) : null}
            </Panel>

            {totals ? (
              <DocSummary>
                <DocSummaryItem label={UI.summary.lines} value={totals.lineCount} />
                <DocSummaryItem label={UI.summary.units} value={formatStockNumber(totals.totalUnits)} />
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
