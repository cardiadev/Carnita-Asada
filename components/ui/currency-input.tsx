'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
    symbol?: string
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, symbol = '$', ...props }, ref) => {
        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 select-none pointer-events-none">
                    {symbol}
                </span>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className={cn('pl-7', className)}
                    ref={ref}
                    {...props}
                />
            </div>
        )
    }
)
CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
