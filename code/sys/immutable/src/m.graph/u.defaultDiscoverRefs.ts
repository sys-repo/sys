import { type t } from './common.ts';

/**
 * Default edge discovery for generic immutable graphs.
 *
 * This base implementation is deliberately conservative and does not
 * infer any edges from document content. Callers that want content-based
 * discovery (for example:
 *
 *   - string fields containing URIs or ids,
 *   - explicit `links: string[]` properties,
 *   - application-specific reference structures,
 *
 * should supply a `discoverRefs` implementation on the walk args.
 *
 * Example:
 *
 * ```ts
 * const discoverRefs: t.GraphDiscoverRefs = ({ doc }) => {
 *   const refs: t.StringId[] = [];
 *
 *   Obj.walk(doc.current, (entry) => {
 *     const value = entry.value;
 *     if (typeof value !== 'string') return;
 *
 *     // App-specific "ref:<id>" scheme.
 *     const prefix = 'ref:';
 *     if (!value.startsWith(prefix)) return;
 *
 *     const id = value.slice(prefix.length) as t.StringId;
 *     if (id) refs.push(id);
 *   });
 *
 *   return refs;
 * };
 * ```
 */
export const defaultDiscoverRefs: t.GraphDiscoverRefs = () => {
  // No outbound references by default.
  return [];
};
