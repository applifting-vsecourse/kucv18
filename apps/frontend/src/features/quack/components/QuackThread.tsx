import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { Mood } from "@/lib/moods"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { quackThreadQueryOptions } from "@/features/quack/api/quackThreadQueryOptions"
import { QuackItem } from "@/features/quack/components/QuackItem"
import { ReplyForm } from "@/features/quack/components/ReplyForm"

const BackLink = () => (
  <Link
    to="/quacks"
    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft className="size-4" />
    All quacks
  </Link>
)

type QuackThreadProps = {
  quackId: string
  // Who is looking. The route reads the session and passes it down, so the
  // quack feature stays independent of auth.
  currentUserId?: string
  isAdmin: boolean
  defaultMood?: Mood | null
}

export function QuackThread({ quackId, currentUserId, isAdmin, defaultMood }: QuackThreadProps) {
  const threadQuery = useQuery(quackThreadQueryOptions(quackId))
  // The author or an admin; the server enforces the same rule. A deleted
  // quack has no author left and cannot be deleted again.
  const canDelete = (quack: Quack) =>
    !quack.isDeleted && (isAdmin || quack.userId === currentUserId)

  if (threadQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (threadQuery.error || !threadQuery.data) {
    return (
      <>
        <BackLink />
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load this quack</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>It may have been deleted.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void threadQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </>
    )
  }

  const thread = threadQuery.data

  return (
    <>
      <BackLink />

      <QuackItem
        quack={thread}
        canDelete={canDelete(thread)}
      />

      <h2 className="mt-6 mb-2 text-lg font-semibold tracking-tight">Replies</h2>

      {thread.replies.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          No replies yet. Replies to this quack appear here.
        </p>
      ) : (
        <div className="flex flex-col">
          {thread.replies.map((reply) => (
            <QuackItem
              key={reply.id}
              quack={reply}
              canDelete={canDelete(reply)}
            />
          ))}
        </div>
      )}

      {thread.isDeleted ? (
        <p className="mt-6 text-sm text-muted-foreground">
          This quack was deleted, so it can&apos;t get new replies.
        </p>
      ) : (
        <ReplyForm
          className="mt-6"
          quackId={thread.id}
          defaultMood={defaultMood}
        />
      )}
    </>
  )
}
