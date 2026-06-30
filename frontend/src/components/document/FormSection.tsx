import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type FormSectionProps = HTMLAttributes<HTMLElement> & {
  title: string
  zone: string
  actions?: ReactNode
}

export function FormSection({ className, title, zone, actions, children, ...props }: FormSectionProps) {
  return (
    <section className={cn('bx-form-section', className)} {...props}>
      <div className="bx-form-section__header">
        <h2 className="bx-form-section__title" data-zone={zone}>
          {title}
        </h2>
        {actions}
      </div>
      <div className="bx-form-section__body">{children}</div>
    </section>
  )
}

export type FormFieldProps = HTMLAttributes<HTMLDivElement>

export function FormField({ className, children, ...props }: FormFieldProps) {
  return (
    <div className={cn('bx-form-field', className)} {...props}>
      {children}
    </div>
  )
}

export type DocLayoutProps = HTMLAttributes<HTMLDivElement>

export function DocLayout({ className, children, ...props }: DocLayoutProps) {
  return (
    <div className={cn('bx-doc-layout', className)} {...props}>
      {children}
    </div>
  )
}

export type DocMetaRowProps = HTMLAttributes<HTMLDivElement>

export function DocMetaRow({ className, children, ...props }: DocMetaRowProps) {
  return (
    <div className={cn('bx-doc-meta-row', className)} {...props}>
      {children}
    </div>
  )
}

export type DocMetaItemProps = HTMLAttributes<HTMLSpanElement> & {
  label: string
  value: ReactNode
  mono?: boolean
}

export function DocMetaItem({ label, value, mono, className, ...props }: DocMetaItemProps) {
  return (
    <span className={cn('bx-doc-meta-item', className)} {...props}>
      {label}: <strong className={cn(mono && 'font-mono')}>{value}</strong>
    </span>
  )
}

export type DocSummaryProps = HTMLAttributes<HTMLDivElement>

export function DocSummary({ className, children, ...props }: DocSummaryProps) {
  return (
    <div className={cn('bx-doc-summary', className)} {...props}>
      {children}
    </div>
  )
}

export type DocSummaryItemProps = {
  label: string
  value: ReactNode
}

export function DocSummaryItem({ label, value }: DocSummaryItemProps) {
  return (
    <div className="bx-doc-summary__item">
      <div className="bx-doc-summary__label">{label}</div>
      <div className="bx-doc-summary__value">{value}</div>
    </div>
  )
}

export type DocInfoStripProps = HTMLAttributes<HTMLDivElement>

export function DocInfoStrip({ className, children, ...props }: DocInfoStripProps) {
  return (
    <div className={cn('bx-doc-info-strip', className)} {...props}>
      {children}
    </div>
  )
}

export type DocInfoItemProps = {
  label: string
  value: ReactNode
  mono?: boolean
}

export function DocInfoItem({ label, value, mono }: DocInfoItemProps) {
  return (
    <div className="bx-doc-info-strip__item">
      <span className="bx-doc-info-strip__label">{label}</span>
      <span className={cn('bx-doc-info-strip__value', mono && 'mono')}>{value}</span>
    </div>
  )
}
