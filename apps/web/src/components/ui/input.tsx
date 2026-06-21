import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground shadow-xs',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
