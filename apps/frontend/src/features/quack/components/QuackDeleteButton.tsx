import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useDeleteQuack } from "@/features/quack/hooks/useDeleteQuack"

type QuackDeleteButtonProps = {
  quackId: string
  // A quack with replies keeps an empty "deleted" placeholder so the replies stay.
  hasReplies?: boolean
}

// The server decides who may delete; this button is only shown to the author.
export function QuackDeleteButton({ quackId, hasReplies }: QuackDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const deleteQuack = useDeleteQuack()

  const handleOpenChange = (isNextOpen: boolean) => {
    setIsOpen(isNextOpen)
    if (!isNextOpen) deleteQuack.reset()
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete quack"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this quack?</DialogTitle>
            <DialogDescription>
              {hasReplies
                ? "Its text and poll will be removed. The replies stay. This can't be undone."
                : "It will be removed from the feed, along with its poll. This can't be undone."}
            </DialogDescription>
          </DialogHeader>

          {deleteQuack.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{deleteQuack.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteQuack.isPending}
              onClick={() => deleteQuack.mutate(quackId)}
            >
              {deleteQuack.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
