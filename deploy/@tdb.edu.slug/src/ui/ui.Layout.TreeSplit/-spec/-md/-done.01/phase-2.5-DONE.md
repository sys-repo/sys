## Phase 2.5: Loader (schema + transport) — NOTE / NEXT

Intent:
Introduce a reusable, correct data ingress path without touching UI logic.

Responsibilities:
- Fetch JSON from HTTP endpoint.
- Validate against `slug.SlugTree` schema.
- Emit a *typed* SlugTree structure or fail fast.

Constraints:
- Loader lives **outside** `Layout.TreeSplit` (likely `@tdb.edu.slug` or a small adapter module).
- UI never knows:
  - where data came from
  - whether it was fetched or cached
  - how it was validated
- Spec may temporarily call the loader once it exists.

Design guardrails:
- Schema validation is mandatory (no “trust the JSON”).
- Loader returns domain data, not Tree UI data.
- Tree mapping remains a separate adapter step.

Explicit non-goals:
- No selection logic.
- No caching/persistence policy.
- No retry/backoff logic.
