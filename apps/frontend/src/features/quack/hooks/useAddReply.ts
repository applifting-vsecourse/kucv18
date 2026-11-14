import { useMutation, useQueryClient } from "@tanstack/react-query"

import { addReply } from "@/features/quack/api/addReply"
import { quackKeys } from "@/features/quack/api/quackKeys"

export function useAddReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addReply,
    onSuccess: async () => {
      // The thread shows the new reply, the feed shows the new count.
      await queryClient.invalidateQueries({ queryKey: quackKeys.all() })
    },
  })
}
