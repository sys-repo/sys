import { type t } from '../../-test.ts';
import { Rx } from '../common.ts';

/**
 * Fake ref for testing (no @sys/immutable dependency).
 */
export function createFakeRef<S extends object>(initial: S) {
  const $ = Rx.subject<{ readonly after: S }>();
  let _state = { ...initial };

  return {
    get current() {
      return _state;
    },
    change(mutator: (draft: S) => void) {
      const prev = _state;
      const next = { ..._state };
      mutator(next);
      if (shallowEqual(prev, next)) return; // No-op suppression.
      _state = next;
      $.next({ after: _state });
    },
    events(dispose$: t.UntilInput) {
      const life = Rx.lifecycle(dispose$);
      life.dispose$.subscribe(() => $.complete());
      return { $ };
    },
  };
}

function shallowEqual<T extends object>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.is((a as any)[k], (b as any)[k])) return false;
  }
  return true;
}
