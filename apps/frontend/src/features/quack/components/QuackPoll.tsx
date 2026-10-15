import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

import type { Poll } from "@/features/quack/api/quackSchemas"

type QuackPollProps = { poll: Poll }

const percentOf = (votes: number, total: number) =>
  total === 0 ? 0 : Math.round((votes / total) * 100)

export function QuackPoll({ poll }: QuackPollProps) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {poll.options.map((option) => {
          const percent = percentOf(option.votes, poll.totalVotes)
          const isMine = poll.myVoteOptionId === option.id
          return (
            <li
              key={option.id}
              className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md border border-border px-3 py-2 text-sm"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-secondary"
                style={{ width: `${percent}%` }}
              />
              <span className="relative flex items-center gap-2 break-words">
                {isMine ? (
                  <Check
                    className="size-4"
                    aria-label="Your vote"
                  />
                ) : null}
                <span className={cn(isMine && "font-medium")}>{option.text}</span>
              </span>
              <span className="relative shrink-0 text-muted-foreground">
                {option.votes} · {percent}%
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  )
}
