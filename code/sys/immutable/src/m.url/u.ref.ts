import { type t, Immutable, Is } from './common.ts';
import { toUrl } from './u.ts';

/**
 * Construct an ImmutableRef<URL> from a UrlLike input.
 */
export const ref: t.ImmutableUrlLib['ref'] = (init) => {
  if (!Is.urlLike(init)) throw new Error('Url.ref: init must be UrlLike');

  return Immutable.clonerRef<URL>(toUrl(init), {
    clone<C>(value: C): C {
      if (value instanceof URL) return new URL(value.href) as C;
      return value;
    },
  }) satisfies t.UrlRef;
};
