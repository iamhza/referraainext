import { cn } from '@/lib/shared/utils'
import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn(
      "mx-auto px-4 sm:px-6 lg:px-8",
      "max-w-[1400px]", // Custom width for better form display
      "pt-8 sm:pt-12",
      "animate-in fade-in-50 slide-in-from-bottom-4",
      "duration-700 ease-in-out",
      "relative z-10",
      "before:absolute before:inset-0 before:-z-10",
      "before:bg-gradient-to-b before:from-white/80 before:to-white/40",
      "before:backdrop-blur-[2px]",
      className
    )}>
      <div className="mx-auto relative">
        {children}
      </div>
    </div>
  )
} 