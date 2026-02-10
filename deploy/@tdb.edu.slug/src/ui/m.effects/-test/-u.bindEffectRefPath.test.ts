import { describe, expect, it } from '../../../-test.ts';
import { Immutable, Obj } from '../common.ts';
import { bindEffectRefPath } from '../mod.ts';

type TestRoot = {
  sheet: { content?: TestState };
  untouched: number;
};

type TestState = {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  key?: string;
};

describe('bindEffectRefPath', () => {
  it('reads current state from the bound object path', () => {
    const root = sampleRoot();
    const ref = bindEffectRefPath<TestRoot, TestState>({
      root,
      path: ['sheet', 'content'],
    });

    expect(ref.current.phase).to.eql('idle');
  });

  it('writes through change() using Obj.Path mutation', () => {
    const root = sampleRoot();
    const ref = bindEffectRefPath<TestRoot, TestState>({
      root,
      path: ['sheet', 'content'],
    });

    ref.change((d) => {
      d.phase = 'loading';
      d.key = 'key-1';
    });

    const state = Obj.Path.get<TestState>(root.current, ['sheet', 'content']);
    expect(state).to.eql({ phase: 'loading', key: 'key-1' });
    expect(root.current.untouched).to.eql(0);
  });

  it('emits events only for bound-path changes', () => {
    const root = sampleRoot();
    const ref = bindEffectRefPath<TestRoot, TestState>({
      root,
      path: ['sheet', 'content'],
    });

    const fired: TestState[] = [];
    const events = ref.events();
    events.$.subscribe((e) => fired.push(e.after));

    root.change((d) => {
      d.untouched = 1;
    });
    expect(fired.length).to.eql(0);

    root.change((d) => {
      Obj.Path.Mutate.set(d, ['sheet', 'content', 'phase'], 'ready');
    });
    expect(fired.length).to.eql(1);
    expect(fired[0]).to.eql({ phase: 'ready' });
  });

  it('initial() seeds missing path on first write', () => {
    const root = Immutable.clonerRef<TestRoot>({ sheet: {}, untouched: 0 });
    const ref = bindEffectRefPath<TestRoot, TestState>({
      root,
      path: ['sheet', 'content'],
      initial: () => ({ phase: 'idle' }),
    });

    ref.change((d) => {
      d.phase = 'loading';
      d.key = 'seeded';
    });

    const state = Obj.Path.get<TestState>(root.current, ['sheet', 'content']);
    expect(state).to.eql({ phase: 'loading', key: 'seeded' });
  });
});

/**
 * Helpers:
 */
function sampleRoot() {
  return Immutable.clonerRef<TestRoot>({
    sheet: { content: { phase: 'idle' } },
    untouched: 0,
  });
}
