import { type ReactNode } from 'react'
import { EmptyState, type EmptyStateProps } from '@/components/ui/EmptyState'
import { ErrorState, type ErrorStateProps } from '@/components/ui/ErrorState'
import { LoadingState, type LoadingStateProps } from '@/components/ui/LoadingState'
import { cn } from '@/lib/cn'

export type DataViewStatus = 'loading' | 'error' | 'empty' | 'success'

export type DataViewProps = {
  status: DataViewStatus
  children: ReactNode
  className?: string
  loading?: LoadingStateProps
  error?: ErrorStateProps
  empty?: EmptyStateProps
}

export function DataView({ status, children, className, loading, error, empty }: DataViewProps) {
  if (status === 'loading') {
    return (
      <div className={cn('flex min-h-[200px] items-center justify-center', className)}>
        <LoadingState {...loading} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={cn('flex min-h-[200px] items-center justify-center', className)}>
        <ErrorState {...error} />
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className={cn('flex min-h-[200px] items-center justify-center', className)}>
        <EmptyState {...empty} />
      </div>
    )
  }

  return <>{children}</>
}
