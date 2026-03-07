import { type t } from './common.ts';
import { ref } from './u.ref.ts';

/**
 * Create a tiny DSL wrapper around a UrlRef.
 *
 * - `read` maps the underlying URL snapshot to a config shape.
 * - `write` reapplies the config to the UrlRef.
 */
export function dsl<C>(
  init: t.UrlLike | t.StringUrl,
  read: (url: URL) => C,
  write: (urlRef: t.UrlRef, config: C) => void,
): t.UrlDslRef<C> {
  const urlRef = ref(init);

  const url: t.ImmutableRefReadonly<URL, t.Rfc6902PatchOperation> = {
    get current() {
      return urlRef.current;
    },
    get instance() {
      return urlRef.instance;
    },
    events(until) {
      return urlRef.events(until);
    },
  };

  const change = (fn: (draft: C) => void) => {
    const draft = read(urlRef.current);
    fn(draft);
    write(urlRef, draft);
  };

  const api: t.UrlDslRef<C> = {
    url,
    change,
    get current() {
      return read(urlRef.current);
    },
  };

  return api;
}
