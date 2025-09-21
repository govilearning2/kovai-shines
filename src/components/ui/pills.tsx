
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const PillsContainer = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex flex-wrap gap-2", className)} {...props} />
})
PillsContainer.displayName = "PillsContainer"


type PillProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

export const Pill = React.forwardRef<
    HTMLButtonElement,
    PillProps
>(({ className, selected, children, ...props }, ref) => {
    return (
        <button
            ref={ref}
            type="button"
            className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors flex items-center",
                selected
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-background hover:bg-muted"
            )}
            {...props}
        >
            {children}
        </button>
    )
})
Pill.displayName = "Pill"


type PillsProps = {
  options: { value: string; label: string; icon: React.ElementType }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function Pills({ options, selected, onChange }: PillsProps) {
  const handleSelect = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    )
  }

  return (
    <PillsContainer>
      {options.map((option) => (
        <Pill
          key={option.value}
          onClick={() => handleSelect(option.value)}
          selected={selected.includes(option.value)}
        >
          <option.icon className="mr-2 h-4 w-4" />
          {option.label}
        </Pill>
      ))}
    </PillsContainer>
  )
}
