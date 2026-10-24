import { Loader2, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackItem } from "@/features/quack/components/QuackItem"

type QuackListProps = {
  quacks: Quack[]
  isLoading?: boolean
  error?: Error
  search?: string
  // Decides which quacks show Delete. Hiding the button is only a convenience;
  // the server decides who may delete.
  canDelete?: (quack: Quack) => boolean
  // Set when the list is filtered to the current user's quacks.
  isMineOnly?: boolean
  onWriteFirst?: () => void
  onReload?: () => void
}

export function QuackList({
  quacks,
  isLoading,
  error,
  search,
  canDelete,
  isMineOnly,
  onWriteFirst,
  onReload,
}: QuackListProps) {
  return (
    <div className="flex flex-col">
      {isLoading && quacks.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : null}

      {error ? (
        <Alert
          variant="destructive"
          className="mb-4"
        >
          <AlertTitle>Couldn&apos;t load quacks</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error.message}</span>
            {onReload ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onReload}
              >
                <RefreshCw className="size-4" />
                Reload
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !error && quacks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? `No posts found matching: '${search}'.`
              : isMineOnly
                ? "You haven't posted any quacks yet."
                : "No quacks yet. Post the first one."}
          </p>
          {isMineOnly && !search && onWriteFirst ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onWriteFirst}
            >
              Write your first quack
            </Button>
          ) : null}
        </div>
      ) : null}

      {quacks.map((quack) => (
        <QuackItem
          key={quack.id}
          quack={quack}
          canDelete={canDelete?.(quack) ?? false}
        />
      ))}
    </div>
  )
}
