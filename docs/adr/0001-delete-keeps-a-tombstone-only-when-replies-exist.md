# 0001 · Deleting a quack: tombstone only when replies exist

Status: Accepted · 2026-11-14

## Context

Quacks can now have replies (see `story-replies.md`). Two requirements pull against each other:

- Replies belong to the people who wrote them. They must not disappear when the author of the parent deletes it.
- When someone deletes a quack, its content must really disappear from the app: feed, replies and search.

Until now, delete was a real `DELETE` and everything hanging off the quack (poll, options, votes) went with it by `onDelete: Cascade`. That works only while nothing else depends on a quack. Replies are the first thing that does, and the rule we choose here applies to every future feature that hangs off a quack.

Constraints: production already holds data, so the migration must not rewrite or lose it. Permissions stay in one place in the service (`isOwner || isAdmin`).

## Decision

Delete is decided by whether the quack has replies:

- **No replies:** a real `DELETE`. The row is gone.
- **Has replies:** the row stays as a tombstone. `text` and `mood` are set to `NULL`, the poll (with its options and votes) is deleted, and `deletedAt` is set. The API exposes nothing about it except that it was deleted: no author, no date. `userId` stays in the row only for the foreign key.
- **Replies are always really deleted** (they cannot have replies themselves). If that removes the last reply of a tombstone, the tombstone is deleted in the same transaction. A tombstone therefore always has at least one reply.

`parentId` uses `onDelete: Restrict`, so the database itself refuses to delete a quack that has replies. A tombstone is hidden from "Mine", stays in the feed so its replies stay reachable, and accepts no new replies (409).

Rule for the whole app: anything that reads quacks must treat `deletedAt IS NOT NULL` as "no content". A new feature must not copy quack content anywhere else, because a copy would outlive the delete.

## Options considered

- **Hard delete, replies become top-level (`onDelete: SetNull`).** Simplest, but the replies lose their parent and land in the feed as orphans, which is the problem we are solving. Also silent: nobody notices it happening.
- **Hard delete, replies keep a loose `replyToId` with no foreign key.** The content is gone, but we give up referential integrity and every reader must cope with dangling ids.
- **Cascade (replies deleted with the parent).** Contradicts the request: replies must not disappear.
- **Tombstone always, even with no replies.** Uniform, but it fills the feed and table with empty rows that nothing depends on. Rejected for the "no replies" case.
- **Tombstone kept forever after its last reply goes.** Simplest delete code, but breaks the rule that a tombstone exists only while something depends on it. A scheduled cleanup instead would need a scheduler and leaves a window of dead rows.
- **Anonymous tombstone (drop `userId` too).** Stronger privacy than the story needs. It makes `userId` nullable for every quack and complicates the cascade when a user is deleted.
- **Tombstone shows author and date.** More informative, but it goes against "really disappear".

## Consequences

- `Quack.text` becomes nullable. Code that reads quacks must handle a tombstone (a deleted flag in the response, `text` absent).
- Every query that lists or searches quacks has to respect `parentId` and `deletedAt`: the feed (top-level only), "Mine" (not deleted), search (skip tombstones, also when matching the author name). Forgetting one leaks a tombstone or a reply, so each gets a test.
- The delete path is a transaction with three outcomes (hard delete, tombstone, hard delete plus clean-up of the parent). The permission check stays one `isOwner || isAdmin` condition before it.
- Deleting a user whose quacks have replies from others fails at the database (`Restrict`). Account deletion is not a feature today. When it arrives it needs its own ADR, for example anonymizing the user's content or tombstoning it.
- A tombstone is a real row with no content. Anything stored on a quack in the future (media, links, etc.) must be wiped in the same step, or this ADR is violated.
- Allowing reply-to-reply or polls on replies later does not change this decision, but nested replies would need the "tombstone exists only while it has replies" rule restated for deeper levels.
