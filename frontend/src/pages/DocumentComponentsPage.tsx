import {
  DocInfoItem,
  DocInfoStrip,
  DocLayout,
  DocSummary,
  DocSummaryItem,
  FormField,
  FormSection,
  QtyControl,
} from '@/components/document'
import { PageHeader } from '@/components/layout'
import { Alert, Badge, Input, Label, Select, Textarea } from '@/components/ui'
import { DOCUMENT_UI } from '@/config/document-ui'
import { MOCK_AJUSTE, resolveAjusteAdjustTypeLabel, resolveWarehouseLabel as resolveAjusteWarehouseLabel } from '@/mocks/documents/ajuste'
import { MOCK_DESPACHO } from '@/mocks/documents/despacho'
import { MOCK_RECEPCION } from '@/mocks/documents/recepcion'
import { MOCK_TRASLADO, resolveTrasladoReasonLabel, resolveWarehouseLabel } from '@/mocks/documents/traslado'
import { DOCUMENT_LINE_STATUS_BADGES, DOCUMENT_STATUS_BADGES } from '@/mocks/documents/types'
import { pageBreadcrumbs } from '@/lib/breadcrumbs'

const UI = DOCUMENT_UI.recepcion
const demo = MOCK_RECEPCION

export function DocumentComponentsPage() {
  return (
    <div className="flex flex-col gap-10 pb-8">
      <PageHeader
        breadcrumbs={pageBreadcrumbs('Documentos')}
        eyebrow="DS · Documentos"
        title="Componentes de documento"
        lead="FormSection, QtyControl, DocLayout, DocInfoStrip y DocSummary. Reutilizados en los cuatro tipos de documento."
      />

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">DocInfoStrip + badges</h2>
        <DocInfoStrip>
          <DocInfoItem label={UI.strip.date} value={demo.header.date} mono />
          <DocInfoItem label={UI.strip.supplier} value={demo.header.supplierOptions[0].label} />
          <DocInfoItem label={UI.strip.warehouse} value={demo.header.warehouseOptions[0].label} />
          <DocInfoItem label={UI.strip.purchaseOrder} value={demo.header.purchaseOrder} mono />
        </DocInfoStrip>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(DOCUMENT_STATUS_BADGES) as Array<keyof typeof DOCUMENT_STATUS_BADGES>).map(
            (status) => (
              <Badge key={status} variant={DOCUMENT_STATUS_BADGES[status].variant}>
                {DOCUMENT_STATUS_BADGES[status].label}
              </Badge>
            ),
          )}
        </div>
      </section>

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">FormSection (cabecera demo)</h2>
        <FormSection title={UI.headerTitle} zone={UI.headerZone}>
          <div className="bx-doc-header-grid">
            <FormField>
              <Label required>{UI.fields.supplier}</Label>
              <Select defaultValue={demo.header.supplier}>
                {demo.header.supplierOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField>
              <Label required>{UI.fields.purchaseOrder}</Label>
              <Input className="font-mono" defaultValue={demo.header.purchaseOrder} readOnly />
            </FormField>
            <FormField>
              <Label required>{UI.fields.date}</Label>
              <Input type="date" defaultValue={demo.header.date} readOnly />
            </FormField>
            <FormField>
              <Label>{UI.fields.warehouse}</Label>
              <Select defaultValue={demo.header.warehouse}>
                {demo.header.warehouseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField>
            <Label>{UI.fields.notes}</Label>
            <Textarea placeholder={UI.fields.notesPlaceholder} readOnly />
          </FormField>
        </FormSection>
      </section>

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">QtyControl + estado línea</h2>
        <div className="flex flex-wrap items-center gap-4">
          <QtyControl value={120} onChange={() => undefined} />
          <QtyControl value={45} onChange={() => undefined} disabled />
          {(Object.keys(DOCUMENT_LINE_STATUS_BADGES) as Array<keyof typeof DOCUMENT_LINE_STATUS_BADGES>).map(
            (status) => (
              <Badge key={status} variant={DOCUMENT_LINE_STATUS_BADGES[status].variant}>
                {DOCUMENT_LINE_STATUS_BADGES[status].label}
              </Badge>
            ),
          )}
        </div>
      </section>

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">DocSummary</h2>
        <DocSummary>
          <DocSummaryItem label={UI.summary.lines} value={demo.lines.length} />
          <DocSummaryItem label={UI.summary.units} value="545" />
          <DocSummaryItem label={UI.summary.differences} value="1" />
          <DocSummaryItem label={UI.summary.operator} value={demo.header.operator} />
        </DocSummary>
      </section>

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">Despacho — DocInfoStrip</h2>
        <DocInfoStrip>
          <DocInfoItem label={DOCUMENT_UI.despacho.strip.client} value={MOCK_DESPACHO.header.client} />
          <DocInfoItem
            label={DOCUMENT_UI.despacho.strip.warehouse}
            value={MOCK_DESPACHO.header.warehouseOptions[0].label}
          />
          <DocInfoItem
            label={DOCUMENT_UI.despacho.strip.orderRef}
            value={MOCK_DESPACHO.header.orderRef}
            mono
          />
          <DocInfoItem label={DOCUMENT_UI.despacho.strip.date} value={MOCK_DESPACHO.header.date} mono />
        </DocInfoStrip>
      </section>

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">Traslado — DocInfoStrip</h2>
        <DocInfoStrip>
          <DocInfoItem
            label={DOCUMENT_UI.traslado.strip.warehouseOrigin}
            value={resolveWarehouseLabel(
              MOCK_TRASLADO.header.warehouseOrigin,
              MOCK_TRASLADO.header.warehouseOriginOptions,
            )}
          />
          <DocInfoItem
            label={DOCUMENT_UI.traslado.strip.warehouseDest}
            value={resolveWarehouseLabel(
              MOCK_TRASLADO.header.warehouseDest,
              MOCK_TRASLADO.header.warehouseDestOptions,
            )}
          />
          <DocInfoItem
            label={DOCUMENT_UI.traslado.strip.reason}
            value={resolveTrasladoReasonLabel(
              MOCK_TRASLADO.header.reason,
              MOCK_TRASLADO.header.reasonOptions,
            )}
          />
          <DocInfoItem
            label={DOCUMENT_UI.traslado.strip.date}
            value={MOCK_TRASLADO.header.date}
            mono
          />
        </DocInfoStrip>
      </section>

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">Ajuste — DocInfoStrip + alerta</h2>
        <DocInfoStrip>
          <DocInfoItem
            label={DOCUMENT_UI.ajuste.strip.adjustType}
            value={resolveAjusteAdjustTypeLabel(
              MOCK_AJUSTE.header.adjustType,
              MOCK_AJUSTE.header.adjustTypeOptions,
            )}
          />
          <DocInfoItem
            label={DOCUMENT_UI.ajuste.strip.warehouse}
            value={resolveAjusteWarehouseLabel(
              MOCK_AJUSTE.header.warehouse,
              MOCK_AJUSTE.header.warehouseOptions,
            )}
          />
          <DocInfoItem label={DOCUMENT_UI.ajuste.strip.date} value={MOCK_AJUSTE.header.date} mono />
          <DocInfoItem label={DOCUMENT_UI.ajuste.strip.countRef} value={MOCK_AJUSTE.header.countRef} mono />
        </DocInfoStrip>
        <Alert variant="warn" title={DOCUMENT_UI.ajuste.approvalAlertTitle} className="mt-4">
          {DOCUMENT_UI.ajuste.approvalAlertMessage}
        </Alert>
      </section>

      <section className="bx-dev-section">
        <h2 className="bx-dev-section__title">Pantallas completas</h2>
        <p className="mb-4 text-sm text-muted">
          Recepción:{' '}
          <a href="/recepcion" className="font-medium text-accent underline-offset-2 hover:underline">
            /recepcion
          </a>
          {' · '}
          Despacho:{' '}
          <a href="/despacho" className="font-medium text-accent underline-offset-2 hover:underline">
            /despacho
          </a>
          {' · '}
          Traslado:{' '}
          <a href="/traslado" className="font-medium text-accent underline-offset-2 hover:underline">
            /traslado
          </a>
          {' · '}
          Ajuste:{' '}
          <a href="/ajuste" className="font-medium text-accent underline-offset-2 hover:underline">
            /ajuste
          </a>
        </p>
        <DocLayout>
          <DocInfoStrip>
            <DocInfoItem label="Recepción" value={demo.header.code} mono />
            <DocInfoItem label="Despacho" value={MOCK_DESPACHO.header.code} mono />
            <DocInfoItem label="Traslado" value={MOCK_TRASLADO.header.code} mono />
            <DocInfoItem label="Ajuste" value={MOCK_AJUSTE.header.code} mono />
            <DocInfoItem
              label="Estado ajuste"
              value={
                <Badge variant={DOCUMENT_STATUS_BADGES[MOCK_AJUSTE.header.status].variant}>
                  {DOCUMENT_STATUS_BADGES[MOCK_AJUSTE.header.status].label}
                </Badge>
              }
            />
          </DocInfoStrip>
        </DocLayout>
      </section>
    </div>
  )
}
