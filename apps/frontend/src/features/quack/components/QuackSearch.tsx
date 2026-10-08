import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const SEARCH_MAX_LENGTH = 100
export const DEBOUNCE_MS = 300

type QuackSearchProps = {
  /** The term currently in the URL. */
  value: string
  /** Called with the trimmed term after the user stops typing; "" resets the feed. */
  onSearch: (search: string) => void
  className?: string
}

export function QuackSearch({ value, onSearch, className }: QuackSearchProps) {
  const [text, setText] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Back/forward or a shared link changes the URL — follow it.
  const [seenValue, setSeenValue] = useState(value)
  if (seenValue !== value) {
    setSeenValue(value)
    if (text.trim() !== value) setText(value)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const searchNow = (value: string) => {
    clearTimeout(timer.current)
    onSearch(value.trim())
  }

  const handleChange = (value: string) => {
    setText(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearch(value.trim()), DEBOUNCE_MS)
  }

  const reset = () => {
    setText("")
    searchNow("")
  }

  return (
    <form
      role="search"
      className={cn("flex flex-col gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault()
        searchNow(text)
      }}
    >
      <Label htmlFor="quack-search">Search</Label>
      <div className="flex gap-2">
        <Input
          id="quack-search"
          type="text"
          value={text}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Text or author name"
          onChange={(event) => handleChange(event.target.value)}
        />
        {text ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={reset}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </form>
  )
}
