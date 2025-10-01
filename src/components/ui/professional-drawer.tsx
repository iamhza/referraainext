"use client"

import * as React from "react"
import { X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfessionalDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  side?: "left" | "right"
  width?: string
  className?: string
}

export function ProfessionalDrawer({
  isOpen,
  onClose,
  children,
  side = "right",
  width = "620px",
  className
}: ProfessionalDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)

  // Enhanced escape key and accessibility
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose])

  // Simple close handler
  const handleClose = React.useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <>
      {/* Backdrop - only show when open */}
      <div 
        className={cn(
          "fixed inset-0 z-30 bg-black/10 cursor-pointer transition-opacity duration-500 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Drawer - always rendered, slides in from off-screen */}
      <div 
        ref={drawerRef}
        className={cn(
          "fixed top-0 h-full z-40 bg-white border-l border-slate-200 shadow-xl",
          side === "right" ? "right-0" : "left-0",
          "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
        style={{ width }}
      >
        {/* Content container */}
        <div className="h-full">
          {children}
        </div>
      </div>
    </>
  )
}

interface DrawerHeaderProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
  showCloseButton?: boolean
}

export function DrawerHeader({ 
  children, 
  className, 
  onClose, 
  showCloseButton = true 
}: DrawerHeaderProps) {
  const [isCloseHovered, setIsCloseHovered] = React.useState(false)
  const [headerMousePos, setHeaderMousePos] = React.useState({ x: 0, y: 0 })

  const handleHeaderMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHeaderMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    })
  }

  return (
    <div 
      className={cn(
        "relative flex items-center justify-between p-6 border-b border-slate-200/60 overflow-hidden",
        "bg-gradient-to-br from-seasalt-100 via-seasalt-200/30 to-seasalt-100",
        "backdrop-blur-sm",
        className
      )}
      onMouseMove={handleHeaderMouseMove}
    >
      {/* Dynamic background gradient following mouse */}
      <div 
        className="absolute inset-0 opacity-40 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at ${headerMousePos.x * 100}% ${headerMousePos.y * 100}%, rgba(109, 205, 210, 0.06) 0%, transparent 60%)`
        }}
      />
      
      {/* Animated border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
      
      <div className="flex-1 relative z-10">
        {children}
      </div>
      
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          onMouseEnter={() => setIsCloseHovered(true)}
          onMouseLeave={() => setIsCloseHovered(false)}
          className={cn(
            "relative ml-4 p-2.5 rounded-xl group",
            "text-slate-400 hover:text-slate-600",
            "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "focus:outline-none focus:ring-2 focus:ring-secondary-500/40 focus:ring-offset-2",
            "hover:bg-slate-100/60 hover:shadow-lg hover:shadow-slate-900/10",
            "hover:scale-105 active:scale-95",
            "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
          )}
        >
          <X className={cn(
            "w-5 h-5 transition-all duration-300",
            "group-hover:rotate-90 group-hover:scale-110",
            isCloseHovered && "drop-shadow-sm"
          )} />
          
          {/* Subtle glow effect on hover */}
          <div className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
          )} />
        </button>
      )}
    </div>
  )
}

interface DrawerBodyProps {
  children: React.ReactNode
  className?: string
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  const [scrollProgress, setScrollProgress] = React.useState(0)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const handleScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const progress = scrollTop / (scrollHeight - clientHeight)
      setScrollProgress(Math.min(Math.max(progress, 0), 1))
      setIsScrolled(scrollTop > 10)
    }
  }, [])

  React.useEffect(() => {
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Scroll progress indicator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-slate-200/60 z-20">
        <div 
          className="h-full bg-gradient-to-r from-secondary-500 to-primary-500 transition-all duration-300 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
      
      {/* Top fade overlay when scrolled */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-seasalt-100 to-transparent z-10 pointer-events-none transition-opacity duration-300",
        isScrolled ? "opacity-100" : "opacity-0"
      )} />
      
      {/* Bottom fade overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-seasalt-200/80 to-transparent z-10 pointer-events-none" />
      
      <div 
        ref={scrollRef}
        className={cn(
          "h-full overflow-y-auto overflow-x-hidden",
          // Custom scrollbar with advanced styling
          "scrollbar-thin scrollbar-thumb-slate-300/60 scrollbar-track-transparent",
          "hover:scrollbar-thumb-slate-400/80",
          // Smooth scrolling
          "scroll-smooth",
          className
        )}
        style={{
          scrollbarGutter: 'stable'
        }}
      >
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  )
}

interface DrawerFooterProps {
  children: React.ReactNode
  className?: string
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div className={cn(
      "p-6 border-t border-gray-200/80",
      "bg-gradient-to-r from-white to-gray-50/50",
      "flex items-center justify-end gap-3",
      className
    )}>
      {children}
    </div>
  )
}

interface DrawerTitleProps {
  children: React.ReactNode
  className?: string
}

export function DrawerTitle({ children, className }: DrawerTitleProps) {
  return (
    <h2 className={cn(
      "text-xl font-semibold text-gray-900",
      "tracking-tight leading-tight",
      className
    )}>
      {children}
    </h2>
  )
}

interface DrawerSubtitleProps {
  children: React.ReactNode
  className?: string
}

export function DrawerSubtitle({ children, className }: DrawerSubtitleProps) {
  return (
    <p className={cn(
      "text-sm text-gray-600 mt-1",
      className
    )}>
      {children}
    </p>
  )
}

// World-class Tab Navigation with Advanced Micro-interactions
interface DrawerTabsProps {
  tabs: Array<{
    id: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function DrawerTabs({ tabs, activeTab, onTabChange, className }: DrawerTabsProps) {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null)
  const [tabPositions, setTabPositions] = React.useState<Record<string, { left: number, width: number }>>({})
  const tabsRef = React.useRef<HTMLDivElement>(null)
  const activeTabRef = React.useRef<HTMLButtonElement>(null)

  // Calculate tab positions for smooth indicator animation
  React.useEffect(() => {
    if (tabsRef.current) {
      const positions: Record<string, { left: number, width: number }> = {}
      const buttons = tabsRef.current.querySelectorAll('[data-tab-id]')
      
      buttons.forEach((button) => {
        const tabId = button.getAttribute('data-tab-id')
        if (tabId) {
          const rect = button.getBoundingClientRect()
          const containerRect = tabsRef.current!.getBoundingClientRect()
          positions[tabId] = {
            left: rect.left - containerRect.left,
            width: rect.width
          }
        }
      })
      
      setTabPositions(positions)
    }
  }, [tabs, activeTab])

  const activeTabPosition = tabPositions[activeTab]
  const hoveredTabPosition = hoveredTab ? tabPositions[hoveredTab] : null

  return (
    <div className={cn(
      "relative border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 overflow-hidden",
      className
    )}>
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/5 via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <nav ref={tabsRef} className="relative flex px-6" aria-label="Tabs">
        {/* Dynamic active tab indicator */}
        {activeTabPosition && (
          <div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-secondary-500 to-primary-500 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-full"
            style={{
              left: activeTabPosition.left,
              width: activeTabPosition.width,
              transform: 'translateY(-1px)'
            }}
          />
        )}
        
        {/* Hover indicator */}
        {hoveredTabPosition && hoveredTab !== activeTab && (
          <div
            className="absolute bottom-0 h-px bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-300 ease-out opacity-60"
            style={{
              left: hoveredTabPosition.left,
              width: hoveredTabPosition.width,
            }}
          />
        )}

        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isHovered = hoveredTab === tab.id
          
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              data-tab-id={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                "relative flex items-center gap-2.5 py-4 px-4 font-medium text-sm group",
                "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "hover:bg-gradient-to-br hover:from-slate-50/80 hover:to-white/80 rounded-t-lg",
                "focus:outline-none focus:ring-2 focus:ring-secondary-500/40 focus:ring-offset-2",
                isActive
                  ? "text-primary-600 bg-gradient-to-br from-primary-50/50 to-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
                "before:absolute before:inset-0 before:rounded-t-lg before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              )}
              style={{
                transform: isHovered || isActive ? 'translateY(-1px)' : 'translateY(0)',
              }}
            >
              {Icon && (
                <Icon className={cn(
                  "w-4 h-4 transition-all duration-300",
                  isActive 
                    ? "text-secondary-500 drop-shadow-sm" 
                    : "text-slate-400 group-hover:text-slate-500",
                  (isHovered || isActive) && "scale-110"
                )} />
              )}
              
              <span className={cn(
                "transition-all duration-300",
                isActive && "font-semibold",
                (isHovered || isActive) && "tracking-wide"
              )}>
                {tab.label}
              </span>
              
              {/* Active tab glow */}
              {isActive && (
                <div className="absolute inset-0 rounded-t-lg bg-gradient-to-br from-secondary-500/10 to-transparent opacity-50" />
              )}
              
              {/* Hover ripple effect */}
              <div className={cn(
                "absolute inset-0 rounded-t-lg bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              )} />
            </button>
          )
        })}
      </nav>
      
      {/* Subtle bottom shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
    </div>
  )
}

// World-class Content Section with Intersection Observer animations
interface DrawerSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
  delay?: number
}

export function DrawerSection({ title, children, className, delay = 0 }: DrawerSectionProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasAnimated, setHasAnimated] = React.useState(false)
  const sectionRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setIsVisible(true)
            setHasAnimated(true)
          }, delay)
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [delay, hasAnimated])

  return (
    <div 
      ref={sectionRef}
      className={cn(
        "p-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-4 scale-[0.98]",
        className
      )}
    >
      {title && (
        <h3 className={cn(
          "text-lg font-semibold text-slate-900 mb-4 transition-all duration-500",
          "bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text",
          isVisible 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-2"
        )}>
          {title}
        </h3>
      )}
      
      <div className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-2"
      )}>
        {children}
      </div>
    </div>
  )
}
