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
import { useTrasladoDocument } from '@/hooks/useTrasladoDocument'
import {
  computeTrasladoTotals,
  deriveTrasladoLineStatus,
  resolveTrasladoReasonLabel,
  resolveWarehouseLabel,
  type TrasladoLine,
} from '@/mocks/documents/traslado'
import {
  DOCUMENT_LINE_STATUS_BADGES,
  DOCUMENT_STATUS_BADGES,
} from '@/mocks/documents/types'
import { formatStockNumber } from '@/mocks/status-labels'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

const UI = DOCUMENT_UI.traslado

export function TrasladoPage() {
  const meta = ROUTE_PAGE_META.traslado
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
  } = useTrasladoDocument()

  const totals = useMemo(
    () => (document ? computeTrasladoTotals(document.lines) : null),
    [document],
  )

  const columns = useMemo<DataTableColumn<TrasladoLine>[]>(
    () => [
      { id: 'line', header: UI.columns.line, mono: true, cell: (row) => row.lineNumber },
      { id: 'sku', header: UI.columns.sku, mono: true, cell: (row) => row.sku },
      { id: 'description', header: UI.columns.description, cell: (row) => row.description },
      {
        id: 'transfer',
        header: UI.columns.transfer,
        cell: (row) => (
          <QtyControl
            value={row.transferQty}
            max={row.plannedQty}
            disabled={isReadOnly || isSaving || isConfirming}
            aria-label={`Cantidad a trasladar línea ${row.lineNumber}`}
            onChange={(transferQty) => {
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
                          transferQty,
                          lineStatus: deriveTrasladoLineStatus(line.plannedQty, transferQty),
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
        id: 'origin',
        header: UI.columns.origin,
        cell: (row) => (
          <Select
            value={row.originLocation}
            disabled={isReadOnly || isSaving || isConfirming}
            aria-label={`Ubicación origen línea ${row.lineNumber}`}
            onChange={(event) => {
              const originLocation = event.target.value
              setDocument((current) => {
                if (!current) {
                  return current
                }
                return {
                  ...current,
                  lines: current.lines.map((line) =>
                    line.id === row.id ? { ...line, originLocation } : line,
                  ),
                }
              })
            }}
          >
            {row.originLocationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ),
      },
      {
        id: 'dest',
        header: UI.columns.dest,
        cell: (row) => (
          <Select
            value={row.destLocation}
            disabled={isReadOnly || isSaving || isConfirming}
            aria-label={`Ubicación destino línea ${row.lineNumber}`}
            onChange={(event) => {
              const destLocation = event.target.value
              setDocument((current) => {
                if (!current) {
                  return current
                }
                return {
                  ...current,
                  lines: current.lines.map((line) =>
                    line.id === row.id ? { ...line, destLocation } : line,
                  ),
                }
              })
            }}
          >
            {row.destLocationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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
    ],
    [isConfirming, isReadOnly, isSaving, setDocument],
  )

  const headerBadge = document
    ? DOCUMENT_STATUS_BADGES[document.header.status]
    : DOCUMENT_STATUS_BADGES.borrador

  const actionsBusy = isSaving || isConfirming

  const originLabel = document
    ? resolveWarehouseLabel(document.header.warehouseOrigin, document.header.warehouseOriginOptions)
    : '—'

  const destLabel = document
    ? resolveWarehouseLabel(document.header.warehouseDest, document.header.warehouseDestOptions)
    : '—'

  const reasonLabel = document
    ? resolveTrasladoReasonLabel(document.header.reason, document.header.reasonOptions)
    : '—'

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
              <DocInfoItem label={UI.strip.warehouseOrigin} value={originLabel} />
              <DocInfoItem label={UI.strip.warehouseDest} value={destLabel} />
              <DocInfoItem label={UI.strip.reason} value={reasonLabel} />
              <DocInfoItem label={UI.strip.date} value={document.header.date} mono />
            </DocInfoStrip>

            <FormSection title={UI.headerTitle} zone={UI.headerZone}>
              <div className="bx-doc-header-grid">
                <FormField>
                  <Label required htmlFor="tra-origin">
                    {UI.fields.warehouseOrigin}
                  </Label>
                  <Select
                    id="tra-origin"
                    value={document.header.warehouseOrigin}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, warehouseOrigin: event.target.value },
                            }
                          : current,
                      )
                    }
                  >
                    {document.header.warehouseOriginOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label required htmlFor="tra-dest">
                    {UI.fields.warehouseDest}
                  </Label>
                  <Select
                    id="tra-dest"
                    value={document.header.warehouseDest}
                    disabled={isReadOnly || actionsBusy}
                    onChange={(event) =>
                      setDocument((current) =>
                        current
                          ? {
                              ...current,
                              header: { ...current.header, warehouseDest: event.target.value },
                            }
                          : current,
                      )
                    }
                  >
                    {document.header.warehouseDestOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label required htmlFor="tra-date">
                    {UI.fields.date}
                  </Label>
                  <Input
                    id="tra-date"
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
                  <Label htmlFor="tra-reason">{UI.fields.reason}</Label>
                  <Select
                    id="tra-reason"
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
              </div>
              <FormField>
                <Label htmlFor="tra-notes">{UI.fields.notes}</Label>
                <Textarea
                  id="tra-notes"
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
                    label={UI.summary.transferred}
                    value={formatStockNumber(totals.transferUnits)}
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
                  label={UI.summary.planned}
                  value={formatStockNumber(totals.plannedUnits)}
                />
                <DocSummaryItem
                  label={UI.summary.transferred}
                  value={formatStockNumber(totals.transferUnits)}
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
