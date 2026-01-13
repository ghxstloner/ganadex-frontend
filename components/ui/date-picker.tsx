"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled,
  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Validar y crear la fecha de forma segura
  const date = React.useMemo(() => {
    if (!value || value.trim() === "") return undefined
    try {
      // Si ya viene en formato ISO completo, usarlo directamente
      // Si viene en formato yyyy-MM-dd, agregar la hora
      let dateString = value
      if (!value.includes("T") && !value.includes("Z")) {
        // Es formato yyyy-MM-dd, agregar hora
        dateString = value + "T00:00:00"
      }
      const dateValue = new Date(dateString)
      // Verificar que la fecha sea válida
      if (isNaN(dateValue.getTime())) return undefined
      return dateValue
    } catch {
      return undefined
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      onChange?.(formattedDate)
      setOpen(false)
    } else {
      onChange?.("")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          id={id}
          name={name}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date && !isNaN(date.getTime()) ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
