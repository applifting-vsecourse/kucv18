import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"

export function useDeleteQuack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteQuack,
    onSuccess: async () => {
      // Refresh the lists and threads: the quack is gone or became a tombstone,
      // and a reply count somewhere may have changed.
      await queryClient.invalidateQueries({ queryKey: quackKeys.all() })
    },
  })
}
