/**
 * @file t.type-gen.ts
 * @summary Generated TypeScript type definitions mapped from local runtime schemas.
 *
 * These types are stable, explicit exports for external use (JSR-safe).
 * The runtime schemas remain in the `m.*.ts` files; do not `Infer` from widened public `TSchema`.
 *
 * Generation rules (concise, repeatable):
 * • Source: scan sibling `m.*.ts` files for `export const <Name>Schema = T.Object(...)`.
 * • Emit: `export type <Name>Props = { ... }` with fields mirroring the schema in declaration order.
 * • Optionality: `T.Optional(X)` → property marked optional (`?`).
 * • Primitives: strings/numbers/booleans map directly; include brief doc from `title`/`description` if useful.
 * • Arrays: `T.Array(U)` → `readonly U[]`.
 * • Records: `T.Record(T.String(), U)` → `{ readonly [key: string]: U }`.
 * • Unions/Literals/Enums: emit TS literal unions.
 * • Unknown: `T.Unknown()` → `unknown` (never `any`).
 * • Readonly: prefer `readonly` props and `readonly T[]` per repo conventions.
 * • Style: type aliases (not interfaces), ASCII quotes, small functions, no classes/`this`.
 *
 * Notes:
 * • Public runtime schemas may be exposed via a widened `t.TSchema` surface (e.g. a namespace),
 *   but external consumers should import these generated types directly (not `Infer<typeof ...>`).
 * • Schema ↔ type drift is enforced with compile-time guards (see `@sys/schema/testing`).
 */
