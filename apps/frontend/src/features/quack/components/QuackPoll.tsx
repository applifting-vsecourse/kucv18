import { Check } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { useVote } from "@/features/quack/hooks/useVote"

type QuackPollProps = { poll: Poll }

const percentOf = (votes: number, total: number) =>
  total === 0 ? 0 : Math.round((votes / total) * 100)

export function QuackPoll({ poll }: QuackPollProps) {
  const vote = useVote()

  const handleVote = (optionId: string) => {
    // Your current answer is already counted; a second vote for another option
    // waits until the first request is done so they can't arrive out of order.
    if (optionId === poll.myVoteOptionId || vote.isPending) return
    vote.mutate({ pollId: poll.id, optionId })
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {vote.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Your vote didn&apos;t go through. {vote.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <ul className="flex flex-col gap-2">
        {poll.options.map((option) => {
          const percent = percentOf(option.votes, poll.totalVotes)
          const isMine = poll.myVoteOptionId === option.id
          return (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={isMine}
                onClick={() => handleVote(option.id)}
                className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-md border border-border px-3 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                      aria-hidden
                    />
                  ) : null}
                  <span className={cn(isMine && "font-medium")}>{option.text}</span>
                </span>
                <span className="relative shrink-0 text-muted-foreground">
                  {option.votes} · {percent}%
                </span>
              </button>
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
