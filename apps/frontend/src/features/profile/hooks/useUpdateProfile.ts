import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authKeys } from "@/lib/auth-keys"

import { updateProfile } from "@/features/profile/api/updateProfile"

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      // The session feeds the header menu and the settings form. Wait for it,
      // so nothing stale flashes.
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}
