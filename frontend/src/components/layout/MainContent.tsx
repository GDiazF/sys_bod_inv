import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'

export type MainContentProps = {
  children: ReactNode
  className?: string
}

export function MainContent({ children, className }: MainContentProps) {
  const location = useLocation()
  const scrollRef = useRef<HTMLElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  return (
    <main
      ref={scrollRef}
      className={cn('min-h-0 flex-1 overflow-y-auto bg-content-grid px-gutter py-6', className)}
    >
      <div className={cn('bx-main-content__inner bx-page-enter motion-reduce:animate-none')} key={location.pathname}>
        {children}
      </div>
    </main>
  )
}
