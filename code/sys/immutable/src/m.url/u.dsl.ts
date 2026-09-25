import { type t } from './common.ts';
import { ref } from './u.ref.ts';

/**
 * Create a tiny DSL wrapper around an immutable URL ref.
 *
 * - `read` maps the underlying URL snapshot to a config shape.
 * - `write` reapplies the config to the immutable URL ref.
 */
export function dsl<C>(
  init: t.Immutable.Url.Input,
  read: (url: URL) => C,
  write: (urlRef: t.Immutable.Url.Ref, config: C) => void,
): t.Immutable.Url.Dsl.Ref<C> {
  const urlRef = ref(init);

  const url: t.Immutable.Url.RefReadonly = {
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

  const api: t.Immutable.Url.Dsl.Ref<C> = {
    url,
    change,
    get current() {
      return read(urlRef.current);
    },
  };

  return api;
}
