/**
 * Canonical structural equality kernel for `@sys/std`.
 *
 * This is the single structural relation behind the `m.Eql.ts` method surface,
 * `@sys/std/eql`, `Obj.eql`, and the legacy `R.equals` compatibility facade.
 * It is intentionally not a universal JavaScript object inspector: it
 * supports a bounded pure-data domain and treats unsupported behavioral or
 * opaque objects as identity-only values.
 *
 * Supported domain:
 * - primitives compare with `Object.is`;
 * - plain records and arrays compare by prototype, extensibility, own keys,
 *   property descriptors, and recursively compared data values;
 * - Date, RegExp, ArrayBuffer/views, Map, and Set have explicit value support;
 * - cyclic/shared references preserve graph topology through a bijective
 *   left↔right object mapping;
 * - unsupported objects with hidden/internal state compare equal only by
 *   identity through the initial `Object.is` check.
 *
 * The kernel is intentionally internal. `deepEquals` takes explicit graph state
 * so callers can isolate top-level equality checks and so Map/Set backtracking
 * can roll back speculative matches. Use `m.Eql.ts` for module methods
 * (`deep`, `unique`, `uniqueBy`).
 */
export { deepEquals } from './u.kernel.deep.ts';
