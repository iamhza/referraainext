/**
 * Enhanced Label component with consistent, visible styling
 */

import * as React from "react"
import { cn } from '@/lib/shared/utils'

export interface EnhancedLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const EnhancedLabel = React.forwardRef<HTMLLabelElement, EnhancedLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium text-gray-900 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )
  }
)
EnhancedLabel.displayName = "EnhancedLabel"

export { EnhancedLabel }
