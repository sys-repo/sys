import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Immutable } from '../../../m.rfc6902/mod.ts';
import { PathRef } from '../mod.ts';

describe('PathRef', () => {
  it('API', async () => {
    const m = await import('@sys/immutable');
    expect(m.PathRef).to.equal(PathRef);
  });

  it('binds current to the leaf path', () => {
    const root = sampleRoot();
    const ref = PathRef.bind<TestRoot, unknown, TestState>({
      root,
      path: ['sheet', 'content'],
    });

    expect(ref.current).to.eql({ phase: 'idle' });
    expect(ref.path).to.eql(['sheet', 'content']);
    expect(ref.root).to.equal(root);
  });

  it('change mutates only the bound path via root immutable change', () => {
    const root = sampleRoot();
    const ref = PathRef.bind<TestRoot, unknown, TestState>({
      root,
      path: ['sheet', 'content'],
    });

    ref.change((d) => {
      d.phase = 'loading';
      d.key = 'a';
    });

    expect(root.current.sheet.content).to.eql({ phase: 'loading', key: 'a' });
    expect(root.current.untouched).to.eql(0);
  });

  it('events only fire for bound-path changes', () => {
    const root = sampleRoot();
    const ref = PathRef.bind<TestRoot, unknown, TestState>({
      root,
      path: ['sheet', 'content'],
    });

    const fired: TestState[] = [];
    ref.events().$.subscribe((e) => fired.push(e.after));

    root.change((d) => {
      d.untouched = 1;
    });
    expect(fired.length).to.eql(0);

    root.change((d) => {
      d.sheet.content = { phase: 'ready' };
    });
    expect(fired).to.eql([{ phase: 'ready' }]);
  });

  it('throws on missing path when no initial factory is provided', () => {
    const root = Immutable.clonerRef<TestRoot>({ sheet: {}, untouched: 0 });
    const ref = PathRef.bind<TestRoot, unknown, TestState>({
      root,
      path: ['sheet', 'content'],
    });

    expect(() => ref.current).to.throw('Missing path-bound state');
  });

  it('initial factory seeds missing path during change', () => {
    const root = Immutable.clonerRef<TestRoot>({ sheet: {}, untouched: 0 });
    const ref = PathRef.bind<TestRoot, unknown, TestState>({
      root,
      path: ['sheet', 'content'],
      initial: () => ({ phase: 'idle' }),
    });

    ref.change((d) => {
      d.phase = 'loading';
      d.key = 'seed';
    });
    expect(root.current.sheet.content).to.eql({ phase: 'loading', key: 'seed' });
  });

  it('type surface is ref-compatible for effect-style consumers', () => {
    const root = sampleRoot();
    const ref = PathRef.bind<TestRoot, unknown, TestState>({
      root,
      path: ['sheet', 'content'],
    });
    expectTypeOf(ref.current).toEqualTypeOf<TestState>();
  });
});

function sampleRoot() {
  return Immutable.clonerRef<TestRoot>({
    sheet: { content: { phase: 'idle' } },
    untouched: 0,
  });
}

type TestRoot = {
  sheet: { content?: TestState };
  untouched: number;
};

type TestState = {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  key?: string;
};
