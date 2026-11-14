import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { QuackThread } from "@/features/quack/components/QuackThread"

// `quacks_` keeps this route out of the /quacks feed layout.
export const Route = createFileRoute("/_ProtectedPages/quacks_/$quackId")({
  component: QuackThreadPage,
})

function QuackThreadPage() {
  const { quackId } = Route.useParams()
  const { user } = useSession()

  return (
    <>
      <Seo title="Quack" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="sr-only">Quack thread</h1>
        <QuackThread
          quackId={quackId}
          currentUserId={user?.id}
          isAdmin={user?.role === "admin"}
          defaultMood={user?.defaultMood}
        />
      </section>
    </>
  )
}
