# Story: Search the quack feed

## Story

**As a** Quacker reader who remembers a word from a post, or who wrote it,
**I want to** type something into a search box and see only the quacks that match,
**so that** I can find a post I saw last week without scrolling through the whole feed.

Product owner: "Nothing fancy for now. We first want to see if people use it." Keep it simple.

## Decisions (no open questions)

- **Search runs on the server**: `GET /api/quacks?q=<term>`. Without `q` the endpoint behaves exactly as today.
- **What is searched**: the quack text, the author's display name, and the author's username. A quack matches if the term appears in any of the three.
- **How it matches**: case-insensitive substring. "duck" matches "Duck", "ducks" and "Caffeinated Duck". Diacritics are taken literally ("kure" does not match "kuře").
- **Edge cases**: the term is trimmed. An empty or whitespace-only term means the full feed. `%` and `_` are plain characters, not wildcards. The maximum length is 100 characters; the server rejects longer terms with a 400 and the input does not accept more than 100.
- **When it runs**: while typing, debounced by 300 ms. No submit button.
- **URL**: the term lives in the URL as `?q=`. Reload, back/forward and a shared link restore the same filtered view, and the input is pre-filled from it.
- **Where**: a search input above the list on `/quacks`, with a visible label "Search" and an icon-only clear (×) button that has an `aria-label`. It is not wrapped in a card.
- **Order**: results stay newest first.
- **While a new term is loading**: the previous results stay visible; no flash of an empty list.
- **Posting while a search is active**: the new quack is posted normally. It appears in the list only if it matches the current term.

## Acceptance criteria

Each one can be checked in the browser, yes or no. Use seed data or post your own quacks.

1. `/quacks` shows a search input labelled "Search" above the list, and it is empty by default.
2. Typing a word that appears in some quacks' text leaves only those quacks in the list. The others disappear without a page reload.
3. Typing a word that appears only in an author's display name shows only that author's quacks.
4. Typing a word that appears only in an author's username shows only that author's quacks.
5. Upper and lower case do not matter: "DUCK" and "duck" give the same list.
6. Part of a word matches: "duc" finds quacks containing "duck".
7. Leading and trailing spaces do not change the result. Typing only spaces shows the full feed.
8. Typing `%` or `_` only matches quacks that really contain that character; it does not return everything.
9. The filtered list is still newest first.
10. After typing, the address bar contains `?q=<term>`. Reloading the page keeps the filter and the input is pre-filled with the term.
11. Opening `/quacks?q=<term>` directly in a new tab shows the filtered list, and the browser Back button returns to the previous term or to the full feed.
12. Clicking × clears the input, removes `?q=` from the URL and shows the full feed. The input keeps focus.
13. The input does not accept more than 100 characters. Calling `GET /api/quacks?q=` with 101 characters directly returns 400.
14. The list does not flicker to empty while the next term loads, and the request is sent once after you stop typing for about 300 ms, not on every keystroke.
15. Posting a quack while a search is active adds it to the list only when it matches the term. If it does not match, the list stays as it is and the quack shows up after the search is cleared.
16. Calling `GET /api/quacks` without a session still returns 401, with or without `q`.

## Nothing to show

- **No match** (a term is set and the list is empty): the list area says `No quacks match "<term>".` and offers a "Clear search" button that does the same as × (criterion 12). It must not show the "No quacks yet. Post the first one." message.
- **No quacks at all** (no term, empty feed): the existing empty state "No quacks yet. Post the first one." stays unchanged.
- **Loading**: the existing loading spinner on first load. Later term changes keep the previous results visible (see Decisions).
- **Error**: the existing error alert with a Reload button also appears when a filtered request fails. Reload retries with the current term.

## Out of scope

- Searching by mood, by date or by a "last week" range.
- Highlighting the matched words in the results.
- Diacritics-insensitive matching, typo tolerance, ranking by relevance, multi-word / quoted / `from:` syntax.
- Pagination or infinite scroll. The feed still loads everything that matches.
- Search history, saved searches, search suggestions.
- Searching from the landing page or from the header.
- Any change to the quack model or to posting.

## Design and conventions

- Follow [`DESIGN.md`](DESIGN.md): visible label, no card around the input, no shadows on the input, tokens only, spacing from the scale.
- The input and the clear button come from `src/components/ui/` (add `input` with `pnpm dlx shadcn@latest add input` if it is missing, then strip shadows).
- Backend: DTO-validated query (`q` optional, trimmed, max 100), repository does the filtering, covered by service/repository tests. Frontend: zod-validated `q` search param, a query key that includes the term, tests for the empty-match state and for the clear action.
- Done also means: `pnpm check-all` passes, and `CLAUDE.md` gets a new rule if the work taught us one (or we say why there was nothing to learn).
