import { Is } from '../../common.ts';

type HrefSnapshot =
  | { readonly kind: 'href'; readonly href: string }
  | { readonly kind: 'unknown' }
  | { readonly kind: 'invalid' };

const UNKNOWN = Object.freeze({ kind: 'unknown' } as const);
const INVALID = Object.freeze({ kind: 'invalid' } as const);

/** Snapshot one URL-like input without evaluating any authority-bearing getter twice. */
export function snapshotHref(input: unknown): HrefSnapshot {
  try {
    if (Is.string(input)) return { kind: 'href', href: input };
    if (!Is.object(input)) return UNKNOWN;

    if ('href' in input) {
      const href = (input as { readonly href?: unknown }).href;
      return Is.string(href) ? { kind: 'href', href } : INVALID;
    }

    const toURL = (input as { readonly toURL?: unknown }).toURL;
    if (!Is.func(toURL)) return UNKNOWN;

    const url = toURL.call(input) as unknown;
    if (!Is.object(url)) return INVALID;
    const href = (url as { readonly href?: unknown }).href;
    return Is.string(href) ? { kind: 'href', href } : INVALID;
  } catch {
    return INVALID;
  }
}
