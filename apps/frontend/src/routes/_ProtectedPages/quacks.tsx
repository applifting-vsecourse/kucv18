import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { Seo } from "@/components/Seo"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useSession } from "@/features/auth/hooks/useSession"
import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"
import { QuackSearch, SEARCH_MAX_LENGTH } from "@/features/quack/components/QuackSearch"

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  validateSearch: z.object({
    q: z.string().trim().max(SEARCH_MAX_LENGTH).optional().catch(undefined),
    // "mine" is resolved against the session, so no user id travels in the URL.
    view: z.enum(["all", "mine"]).optional().catch(undefined),
  }),
  component: QuacksPage,
})

function QuacksPage() {
  // The search term lives in the URL (?q=) so it survives reload and can be shared.
  const search = Route.useSearch().q ?? ""
  const view = Route.useSearch().view ?? "all"
  const navigate = useNavigate({ from: Route.fullPath })
  const quacksQuery = useQuery(quacksQueryOptions(search, view === "mine"))
  const { user } = useSession()

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm
          className="mb-4"
          defaultMood={user?.defaultMood}
        />

        <QuackSearch
          value={search}
          onSearch={(q) =>
            void navigate({ search: (prev) => ({ ...prev, q: q || undefined }), replace: true })
          }
          className="mb-4"
        />

        <Tabs
          value={view}
          onValueChange={(next) =>
            void navigate({
              search: (prev) => ({ ...prev, view: next === "mine" ? "mine" : undefined }),
              replace: true,
            })
          }
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mine">Mine</TabsTrigger>
          </TabsList>
        </Tabs>

        <QuackList
          search={search}
          quacks={quacksQuery.data ?? []}
          currentUserId={user?.id}
          isMineOnly={view === "mine"}
          onWriteFirst={() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus()}
          isLoading={quacksQuery.isLoading}
          error={quacksQuery.error ?? undefined}
          // Only the error state offers a retry — posting invalidates the list,
          // and refocusing the tab refetches it.
          onReload={() => void quacksQuery.refetch()}
        />
      </section>
    </>
  )
}
