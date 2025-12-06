import { type t, AliasResolver, Is } from './common.ts';

/**
 * Resolve an alias-based path using:
 *   - a local resolver (required)
 *   - an optional root `:index` resolver (second hop)
 *
 * Pure: no IO, no env.
 */
export async function resolvePath(
  raw: unknown,
  localResolver: t.Alias.Resolver | undefined,
  indexResolver?: t.Alias.Resolver,
): Promise<t.Alias.ExpandChainResult | undefined> {
  if (!Is.str(raw)) return undefined;
  if (!localResolver) return undefined;

  const chain = await AliasResolver.expandChain(raw, localResolver, {
    async loadNext({ step }) {
      if (!indexResolver) return;
      const unresolved = step.remaining;
      const shouldHop = unresolved.some((key) => key in indexResolver.alias);
      return shouldHop ? indexResolver : undefined;
    },
  });

  return {
    ...chain,
    value: normalizeResolvedPath(chain.value),
  };
}

/**
 * Normalize a resolved path that may still carry the CRDT index envelope.
 *
 * Examples:
 *   "/crdt:21Jv.../alias/~/Documents/.../file.webm"
 *     → "~/Documents/.../file.webm"
 */
function normalizeResolvedPath(value: string): string {
  const withoutEnvelope = stripCrdtIndexEnvelope(value);
  return normalizeTildePath(withoutEnvelope);
}

/**
 * Strip "/crdt:<docId>/alias/" routing envelope if present.
 */
function stripCrdtIndexEnvelope(value: string): string {
  const stripped = value.replace(/^\/?crdt:[^/]+\/alias\//, '/');
  return stripped.replace(/\/+/g, '/');
}

/**
 * Fix leading "/~" for tilde-based user paths.
 */
function normalizeTildePath(value: string): string {
  return value.startsWith('/~/') ? value.slice(1) : value;
}
