# User Story: Search Posts

## Description (User Story)

**As a** feed reader  
**I want to** search for posts by their content text or author name  
**So that** I can easily find a specific post I saw last week, and share the search result with someone else via a link.

---

## Acceptance Criteria

- [ ] **Search Field Placement:** A visible, labelled search input with a clear (reset) button is located above the post feed. There is no separate submit button.
- [ ] **Matching Criteria:** The search query matches against both the post content text and the author's name.
- [ ] **Case and Accent Insensitivity:** The search is case-insensitive and ignores accents/diacritics (e.g., searching `kocka` matches a post containing `Kočka`).
- [ ] **Auto Search:** The search runs automatically shortly after the user stops typing (debounced, ~300 ms). Pressing `Enter` searches immediately.
- [ ] **Feed Filtering:** Searching filters the feed to display only posts containing the given string in either their text or author name.
- [ ] **Resetting the Feed:** Clearing the search input (or clicking the reset button) restores the full feed with all posts. The reset button applies immediately, without the debounce delay.
- [ ] **Shareable URL:** The search query is stored in the URL. Opening such a link, reloading the page, or using browser back/forward shows the same search, with the input pre-filled. An empty search removes the parameter. Typing does not add a history entry for every search.
- [ ] **Empty State:** If no posts match the search query, display a clear message: _"No posts found matching: '[search query]'."_
- [ ] **Language Consistency:** All UI text, labels, messages, and code must be written in English to maintain consistency with the application.

---

## Out of Scope

- **Search Result Highlighting:** Highlighting the matched keyword inside the post text.
- **Suggestions:** Autocomplete or suggestion dropdowns while typing.
