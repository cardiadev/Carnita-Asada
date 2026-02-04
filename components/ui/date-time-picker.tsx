"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"

interface DateTimePickerProps {
    value?: Date
    onChange: (date: Date | undefined) => void
    minDate?: Date
    disabled?: boolean
    placeholder?: string
}

export function DateTimePicker({
    value,
    onChange,
    minDate,
    disabled = false,
    placeholder = "Seleccionar fecha y hora",
}: DateTimePickerProps) {
    const isMobile = useIsMobile()
    const [time, setTime] = React.useState(() => {
        if (value) {
            return format(value, "HH:mm")
        }
        return "12:00"
    })

    // Manejar cambio de fecha desde el calendario
    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            onChange(undefined)
            return
        }

        const [hours, minutes] = time.split(":").map(Number)
        date.setHours(hours, minutes)
        onChange(date)
    }

    // Manejar cambio de hora
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value
        setTime(newTime)

        if (value) {
            const [hours, minutes] = newTime.split(":").map(Number)
            const newDate = new Date(value)
            newDate.setHours(hours, minutes)
            onChange(newDate)
        }
    }

    // Manejar cambio del input nativo datetime-local
    const handleNativeDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        if (inputValue) {
            onChange(new Date(inputValue))
        } else {
            onChange(undefined)
        }
    }

    // Formato para input datetime-local
    const getNativeDateTimeValue = () => {
        if (!value) return ""
        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, "0")
        const day = String(value.getDate()).padStart(2, "0")
        const hours = String(value.getHours()).padStart(2, "0")
        const minutes = String(value.getMinutes()).padStart(2, "0")
        return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    const getMinDateTimeValue = () => {
        if (!minDate) return undefined
        const year = minDate.getFullYear()
        const month = String(minDate.getMonth() + 1).padStart(2, "0")
        const day = String(minDate.getDate()).padStart(2, "0")
        const hours = String(minDate.getHours()).padStart(2, "0")
        const minutes = String(minDate.getMinutes()).padStart(2, "0")
        return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    // En móvil, usar input nativo
    if (isMobile) {
        return (
            <Input
                type="datetime-local"
                value={getNativeDateTimeValue()}
                onChange={handleNativeDateTimeChange}
                min={getMinDateTimeValue()}
                disabled={disabled}
                className="w-full"
            />
        )
    }

    // En desktop, usar shadcn components
    return (
        <div className="flex gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? (
                            format(value, "PPP", { locale: es })
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateSelect}
                        disabled={(date) => minDate ? date < minDate : false}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
                <Label htmlFor="time" className="sr-only">
                    Hora
                </Label>
                <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={handleTimeChange}
                        disabled={disabled}
                        className="w-[120px] pl-9"
                    />
                </div>
            </div>
        </div>
    )
}
