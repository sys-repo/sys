import { type t, Is } from './common.ts';
import { expand } from './u.expand.ts';

type O = Record<string, unknown>;
type Key = t.Alias.Key;
type Map = t.Alias.Map;

/**
 * Chained alias expansion across one or more tables.
 *
 * - starts from the given `resolver`
 * - uses `expand` at each step against the current table
 * - if unresolved tokens remain and `loadNext` is provided, calls it
 *   so callers can supply the next table (resolver or bare map)
 * - stops when:
 *     - there are no remaining tokens, or
 *     - `loadNext` returns null/undefined, or
 *     - `maxDepth` hops have been performed
 */
export async function expandChain<T extends O = O>(
  raw: t.Alias.RawPath,
  resolver: t.Alias.Resolver<T>,
  opts: t.AliasExpandChainOptions<T> = {},
): Promise<t.Alias.ExpandChainResult> {
  const maxDepth = opts.maxDepth ?? 8;
  const { loadNext } = opts;

  const steps: t.Alias.ExpandChainStep[] = [];

  let value: t.Alias.RawPath = raw;
  let currentResolver: t.Alias.Resolver<T> = resolver;

  for (let depth = 0; depth < maxDepth; depth++) {
    // 1. Expand against the current table.
    const step = expand(value, currentResolver.alias);

    const chainStep: t.Alias.ExpandChainStep = {
      value: step.value,
      used: step.used,
      remaining: step.remaining,
      alias: currentResolver.alias,
    };

    steps.push(chainStep);
    value = step.value;

    const hasRemaining = step.remaining.length > 0;
    const canHop = Is.func(loadNext);

    // 2. If nothing left to resolve or no loader, we are done.
    if (!hasRemaining || !canHop) {
      return { value, steps, remaining: step.remaining };
    }

    // 3. Ask caller for the next table (resolver or bare map).
    const next = await loadNext({ value, step, resolver: currentResolver, depth });
    //  Caller declined to continue the chain → finish with current value.
    if (!next) {
      return { value, steps, remaining: step.remaining };
    }

    // 4. Normalize next table into a Resolver<T>.
    type R = t.Alias.Resolver<T>;
    const nextResolver: R = 'alias' in next ? next : { root: {} as T, alias: next };
    currentResolver = nextResolver;
  }

  // Max chain depth reached; report last remaining tokens (if any).
  const lastRemaining = steps.length > 0 ? steps[steps.length - 1].remaining : ([] as Key[]);

  return {
    value,
    steps,
    remaining: lastRemaining,
  };
}
