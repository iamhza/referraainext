import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "mb-8",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <h1 className={cn(
            "text-2xl font-semibold tracking-tight",
            "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
            "bg-clip-text text-transparent",
          )}>
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center space-x-2">
            {children}
          </div>
        )}
      </div>
      <div className="h-px w-full bg-border" />
    </div>
  )
} 