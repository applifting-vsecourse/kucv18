# Quacker — starter template

Full-stack teaching template: pnpm monorepo with two apps.

- `apps/backend` — NestJS + Prisma + Postgres. Auth: BetterAuth (mounted at `/api/auth/*`, treat as a black box). API docs: Swagger at `/api/docs`.
- `apps/frontend` — React + Vite + TanStack Router/Query, Tailwind + shadcn/ui, `ky` + `zod` API client. Feature folders under `src/features/`.

The worked example is the quack feed: `Quack` model → seed → repository → service → `GET`/`POST /api/quacks` (DTO-validated, author taken from the session) → zod schema → TanStack Query → list page + post form. Copy its pattern for new features.

**Before writing or changing any UI, read [`DESIGN.md`](DESIGN.md).** It is a contract, not a suggestion — it exists to stop generated screens drifting into generic nested cards.

## Commands

- `pnpm dev` — everything: env files, Postgres (Docker), migrate, seed, both dev servers
- `pnpm check-all` — lint + type-check + tests + build (same as CI)
- `pnpm backend test` / `pnpm frontend test:ci` — unit tests
- `pnpm backend prisma:migrations:run` — create/apply migrations after schema changes

## Conventions

Deliberately sparse — this file grows as the team learns what it expects from generated code. Add rules here when you find yourself repeating the same review feedback.

### UI controls come from the kit

Need a control that isn't in `src/components/ui/`? Add it with `pnpm dlx shadcn@latest add <name>` — don't hand-roll one in a feature folder, even where a native input would do the job. One accessibility implementation to reason about beats a per-control judgement call.

The CLI puts `shadow-xs`/`shadow-sm` on inputs, textareas and cards. [`DESIGN.md`](DESIGN.md) keeps shadows for things that genuinely float — dialogs, dropdowns, toasts. Strip them.

After `shadcn add`, read the generated file and `git diff package.json` before committing. The CLI has written `import { cn } from "cn"` (an unrelated npm package, which it also added to `package.json`) instead of `@/lib/utils`. Fix the import and revert the dependency.

### UI copy is English

The app's UI is English, whatever language the request is written in. If a prompt, story or chat is in Czech (or anything else), reply in that language, but every string a user can see or hear stays English, sentence case: labels, placeholders, buttons, empty states, errors, `aria-label`s. Never translate existing copy, and when a story quotes UI text, use the English string.

### Story and plan are in Czech

`story.md` and `plan.md` are written in Czech. Keep them in Czech when creating or updating them. This applies to the documents only: code, identifiers, commit messages and every string a user sees in the UI stay English (see above).

### Permissions are checked on the server, in one place

Who may do what (owner, admin, any role) is one condition in the service, next to the data it needs, for example `isOwner || isAdmin`. The role comes from the session via `@User()`, never from the URL or the body. The UI only mirrors the rule to hide buttons: pass a computed flag such as `isAdmin` down from the route, and never ship a rule that exists only in React. Every permission rule gets an E2E test that calls the API directly, and the test must fail when the check is switched off.

### The app is already running

Assume the dev servers are up. If something is listening on the app's ports, that is this application: use it. Don't start a second instance, don't restart it, don't run `pnpm dev`.

Don't reach for the browser to check your own work. Tests and type-checks are the evidence; open the running app when asked to, not on your own initiative.
