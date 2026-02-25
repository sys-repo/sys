import { AliasResolver, Is, Obj } from './common.ts';

type AliasMap = Record<string, string | undefined>;
type AliasResolverLike = { alias: AliasMap };

/**
 * Resolve an alias-based path using:
 * - local resolver (subject slug)
 * - root/index resolver (program index)
 */
export function resolveAliasPath(
  raw: unknown,
  local: AliasResolverLike | undefined,
  index?: AliasResolverLike,
): { value: string; steps: unknown[]; remaining: readonly string[] } | undefined {
  if (!Is.str(raw)) return undefined;
  if (!local) return undefined;

  const localMap = withoutIndex(local.alias);
  const steps: unknown[] = [];

  const first = AliasResolver.expand(raw, localMap);
  steps.push({
    value: first.value,
    used: first.used,
    remaining: first.remaining,
    alias: localMap,
  });

  let value = first.value;
  let remaining = first.remaining;
  const hasIndex = remaining.includes(':index');

  if (!hasIndex || !index) {
    return {
      value: normalizeResolvedPath(value),
      steps,
      remaining: [...remaining],
    };
  }

  const hopped = stripIndexSegments(value);
  const second = AliasResolver.expand(hopped, index.alias);
  steps.push({
    value: second.value,
    used: second.used,
    remaining: second.remaining,
    alias: index.alias,
  });

  value = second.value;
  remaining = second.remaining;

  return Obj.asGetter(
    { value: normalizeResolvedPath(value), steps, remaining: [...remaining] },
    ['steps', 'remaining'],
  );
}

function withoutIndex(map: AliasMap): AliasMap {
  const clone: Record<string, string> = {};
  for (const key in map) {
    if (key === ':index') continue;
    const value = map[key];
    if (typeof value === 'string') clone[key] = value;
  }
  return clone;
}

function stripIndexSegments(value: string): string {
  const parts = value.split('/');
  const leadingSlash = parts[0] === '';
  const filtered = parts.filter((seg) => seg !== ':index' && seg !== '');
  const joined = filtered.join('/');
  return leadingSlash ? `/${joined}` : joined;
}

function normalizeResolvedPath(value: string): string {
  let next = value.replace(/\/+/g, '/');
  if (next.startsWith('/~/')) next = next.slice(1);
  return next;
}
