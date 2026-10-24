import { useMutation, useQueryClient } from "@tanstack/react-query"

import { applyVote, restorePoll } from "@/features/quack/api/applyVote"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"
import { votePoll } from "@/features/quack/api/votePoll"

// Voting feels instant: the cache is updated before the request is sent. If
// the request fails the cache goes back to what it was and `error` tells the
// component to say so. Either way the lists are refetched afterwards, so the
// numbers the user ends up with are the server's.
export function useVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: votePoll,
    onMutate: async ({ pollId, optionId }) => {
      // An older in-flight response would overwrite the optimistic vote.
      await queryClient.cancelQueries({ queryKey: quackKeys.lists() })
      const previous = queryClient.getQueriesData<Quack[]>({ queryKey: quackKeys.lists() })
      queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (quacks) =>
        quacks ? applyVote(quacks, pollId, optionId) : quacks,
      )
      return { previous }
    },
    onError: (_error, { pollId }, context) => {
      for (const [key, data] of context?.previous ?? []) {
        if (!data) continue
        queryClient.setQueryData<Quack[]>(key, (current) =>
          current ? restorePoll(current, data, pollId) : current,
        )
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: quackKeys.lists() }),
  })
}
