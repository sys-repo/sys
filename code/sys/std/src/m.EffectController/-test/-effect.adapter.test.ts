import { describe, expect, it, type t } from '../../-test.ts';
import { EffectController } from '../mod.ts';
import { createFakeRef } from './u.fixture.ts';

type State = {
  count?: number;
  limit?: number;
  flagged?: boolean;
};

function attachLimitFlagEffect(adapter: t.EffectAdapter<State>): () => void {
  return adapter.onChange((state) => {
    if (!state || state.flagged) return;
    if (state.count !== undefined && state.limit !== undefined && state.count > state.limit) {
      adapter.next({ flagged: true });
    }
  });
}

function createAdapter(initial: State = {}) {
  const ref = createFakeRef<State>(initial);
  const controller = EffectController.create<State>({ ref });

  const adapter: t.EffectAdapter<State> = {
    get disposed() {
      return controller.disposed;
    },
    get dispose$() {
      return controller.dispose$;
    },
    current: () => controller.current(),
    onChange: (fn) => controller.onChange(fn),
    next: (patch) => controller.next(patch),
  };

  return { adapter, dispose: () => controller.dispose() };
}

describe('EffectController', () => {
  describe('EffectAdapter example', () => {
    it('tests effect logic without controller dependency', () => {
      const { adapter, dispose } = createAdapter({ count: 0, limit: 1 });
      const unsub = attachLimitFlagEffect(adapter);

      adapter.next({ count: 2 });
      expect(adapter.current().flagged).to.eql(true);

      unsub();
      dispose();
    });
  });
});
