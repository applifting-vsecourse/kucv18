# Architecture Decision Records

One decision per file, numbered. An ADR is never rewritten: a changed decision gets a new ADR that supersedes the old one, and the old one stays as history.

| #                                                                | Title                                               | Status   | Summary                                                                                       |
| ---------------------------------------------------------------- | --------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| [0001](0001-delete-keeps-a-tombstone-only-when-replies-exist.md) | Deleting a quack: tombstone only when replies exist | Accepted | A quack with replies becomes a content-less tombstone, one without replies is really deleted. |
