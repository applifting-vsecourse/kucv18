import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const SEARCH_MAX_LENGTH = 100
const DEBOUNCE_MS = 300

type QuackSearchProps = {
  /** The term currently in the URL. */
  value: string
  onChange: (value: string) => void
  className?: string
}

export function QuackSearch({ value, onChange, className }: QuackSearchProps) {
  const [text, setText] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Back/forward or a shared link changes the URL — follow it.
  const [seenValue, setSeenValue] = useState(value)
  if (seenValue !== value) {
    setSeenValue(value)
    if (text.trim() !== value) setText(value)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleInput = (next: string) => {
    setText(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(next.trim()), DEBOUNCE_MS)
  }

  const clear = () => {
    clearTimeout(timer.current)
    setText("")
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor="quack-search">Search</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="quack-search"
          type="text"
          value={text}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Text or author name"
          className="pr-10"
          onChange={(event) => handleInput(event.target.value)}
        />
        {text ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            className="absolute top-0 right-0"
            onClick={clear}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
