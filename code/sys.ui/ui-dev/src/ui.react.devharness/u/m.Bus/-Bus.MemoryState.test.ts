import { describe, expect, it, TestSample } from '../../-test.ts';
import { BusMemoryState } from './Bus.MemoryState.ts';

describe('BusMemoryState', () => {
  it('deep-merges overlapping changes without dropping nested writes', async () => {
    const state = BusMemoryState({ instance: TestSample.instance() });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => release = resolve);

    const delayed = state.change('state:write', async (draft) => {
      draft.render.state = {
        nested: { fromDelayed: true },
        list: ['delayed'],
      };
      await gate;
    });

    await state.change('state:write', (draft) => {
      draft.render.state = {
        nested: { fromCurrent: true },
        list: ['current'],
      };
    });

    release();
    await delayed;

    expect(state.current.render.state).to.eql({
      nested: { fromCurrent: true, fromDelayed: true },
      list: ['delayed'],
    });
  });

  it('materializes getter-only plain-record properties while merging', async () => {
    const state = BusMemoryState({ instance: TestSample.instance() });

    const status = {} as { readonly ready: boolean };
    Object.defineProperty(status, 'ready', { enumerable: true, get: () => true });

    await state.change('state:write', (draft) => {
      draft.render.state = { status };
    });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => release = resolve);

    const delayed = state.change('state:write', async (draft) => {
      draft.render.state = { ...draft.render.state, delayed: true };
      await gate;
    });

    await state.change('state:write', (draft) => {
      draft.render.state = { ...draft.render.state, current: true };
    });

    release();
    await delayed;

    expect(state.current.render.state).to.eql({
      status: { ready: true },
      current: true,
      delayed: true,
    });
  });
});
