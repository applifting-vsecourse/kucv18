import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { SettingsForm } from "@/features/profile/components/SettingsForm"
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile"
import { quackKeys } from "@/features/quack/api/quackKeys"

export const Route = createFileRoute("/_ProtectedPages/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = useSession()
  const updateProfile = useUpdateProfile()
  const queryClient = useQueryClient()

  return (
    <>
      <Seo title="Settings" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>

        {user ? (
          <SettingsForm
            saved={{
              username: user.username,
              name: user.name,
              bio: user.bio ?? "",
              defaultMood: user.defaultMood,
            }}
            onSave={async (values) => {
              await updateProfile.mutateAsync(values)
              // Every quack shows its author's name and @username.
              await queryClient.invalidateQueries({ queryKey: quackKeys.all() })
              toast.success("Settings saved")
            }}
          />
        ) : null}
      </section>
    </>
  )
}
