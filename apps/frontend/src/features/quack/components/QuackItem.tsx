import type { ReactNode } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/date"
import { MOOD_LABELS } from "@/lib/moods"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackDeleteButton } from "@/features/quack/components/QuackDeleteButton"
import { QuackPoll } from "@/features/quack/components/QuackPoll"
import { UsersName } from "@/features/quack/components/UsersName"
import { UsersUserName } from "@/features/quack/components/UsersUserName"

type QuackItemProps = {
  quack: Quack
  // Convenience only — the server refuses deletes of other people's quacks.
  canDelete?: boolean
  // Renders a link to a thread page. Passed in by the route, which owns the
  // router; without it the item shows no link (lists, tests).
  renderThreadLink?: (quackId: string, label: string) => ReactNode
}

export function QuackItem({ quack, canDelete, renderThreadLink }: QuackItemProps) {
  const replyLabel = quack.replyCount === 1 ? "1 reply" : `${quack.replyCount} replies`

  // A deleted quack kept for its replies: no content, no author, no date.
  if (quack.isDeleted || !quack.user) {
    return (
      <article className="flex w-full flex-col gap-1 border-b border-border pt-2 pb-4 last:border-b-0">
        <p className="text-sm text-muted-foreground">This quack was deleted</p>
        {renderThreadLink ? (
          <div className="text-sm">{renderThreadLink(quack.id, replyLabel)}</div>
        ) : null}
      </article>
    )
  }

  const { name, username } = quack.user

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // A top-level quack links to its thread, a reply (e.g. a search hit) to the
  // thread it belongs to.
  const threadLink = renderThreadLink
    ? quack.parentId
      ? renderThreadLink(quack.parentId, "View thread")
      : renderThreadLink(quack.id, quack.replyCount === 0 ? "Reply" : replyLabel)
    : null

  return (
    <article className="flex w-full gap-4 border-b border-border pt-2 pb-4 last:border-b-0">
      <Avatar className="size-12">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span>
            <UsersName name={name} /> <UsersUserName username={username} />
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <time className="text-xs text-muted-foreground">
            {quack.createdAt ? formatDate(quack.createdAt) : null}
          </time>
          {quack.mood ? (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{MOOD_LABELS[quack.mood]}</span>
            </>
          ) : null}
        </div>
        <p className="text-sm break-words whitespace-pre-line">{quack.text}</p>
        {quack.poll ? <QuackPoll poll={quack.poll} /> : null}
        {threadLink ? <div className="text-sm">{threadLink}</div> : null}
      </div>

      {canDelete ? (
        <QuackDeleteButton
          quackId={quack.id}
          hasReplies={quack.replyCount > 0}
        />
      ) : null}
    </article>
  )
}
