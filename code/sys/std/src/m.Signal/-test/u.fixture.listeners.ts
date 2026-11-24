import { Dispose, type t } from '../common.ts';
import { Signal } from '../mod.ts';

type Fixture = globalThis.Disposable & {
  readonly listeners: t.SignalListeners;
  /** Trigger the selected disposal path; separate from fixture teardown. */
  readonly dispose: () => void;
};

/** Wire a real collection/owner pair and guarantee test-scope teardown. */
export function listenersFixture(mode: 'direct' | 'external'): Fixture {
  const owner = mode === 'external' ? Dispose.lifecycle() : undefined;
  const listeners = Signal.listeners(owner);

  return {
    listeners,
    dispose: owner?.dispose ?? listeners.dispose,
    [Symbol.dispose]() {
      // Assertions run before this fallback; it must not stand in for the tested path.
      try {
        listeners.dispose();
      } finally {
        owner?.dispose();
      }
    },
  };
}
