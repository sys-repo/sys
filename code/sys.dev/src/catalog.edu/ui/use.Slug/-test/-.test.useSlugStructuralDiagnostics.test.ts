import {
  act,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  renderHook,
  Str,
} from '../../../-test.ts';

import { type t } from '../common.ts';
import { useSlugDiagnostics } from '../mod.ts';
import { __test as TD } from '../use.Slug.Diagnostics.ts';
import { makeEditorYamlFromText } from './-u.ts';

describe('useSlugDiagnostics', () => {
  DomMock.init({ beforeAll, afterAll });

  /**
   * Minimal Slug registry stub.
   */
  const registry: t.SlugTraitRegistry = {
    all: [],
    get: () => undefined,
  };

  const D = (p: Partial<t.Yaml.Diagnostic> = {}): t.Yaml.Diagnostic => ({
    message: p.message ?? 'msg',
    code: p.code,
    path: p.path,
    range: p.range,
  });

  /**
   * Unit: helpers (pure, deterministic).
   */
  describe('useSlugDiagnostics: helpers', () => {
    it('fingerprint excludes message text', () => {
      const base = { code: 'X', path: ['a', 'b'], range: [10, 20] as const };
      const a = D({ ...base, message: 'one' });
      const b = D({ ...base, message: 'two' });
      expect(TD.fingerprintOf(a)).to.eql(TD.fingerprintOf(b));
    });

    it('toKey is order-insensitive', () => {
      const a = D({ code: 'A', path: ['x'], range: [0, 1] as const });
      const b = D({ code: 'B', path: ['y'], range: [2, 3] as const });
      expect(TD.toKey([a, b])).to.eql(TD.toKey([b, a]));
    });

    it('toDiagnostics de-duplicates structural + semantic overlap', () => {
      const diag = D({ code: 'DUP', path: ['foo'], range: [5, 9] as const });
      const structural = [diag];
      const semantic = [D({ ...diag, message: 'different wording' })];

      const merged = TD.toDiagnostics(structural, semantic);
      expect(merged.length).to.eql(1);
      expect(TD.fingerprintOf(merged[0])).to.eql(TD.fingerprintOf(diag));
    });

    it('key stability: message-only changes do NOT change key', () => {
      const a = D({ code: 'C', path: ['p'], range: [1, 2] as const, message: 'm1' });
      const b = D({ code: 'C', path: ['p'], range: [1, 2] as const, message: 'm2' });
      expect(TD.toKey([a])).to.eql(TD.toKey([b]));
    });

    it('key changes when code/path/range changes', () => {
      const base = { path: ['p'], range: [1, 2] as const };
      const c1 = D({ code: 'C1', ...base });
      const c2 = D({ code: 'C2', ...base });
      expect(TD.toKey([c1])).not.to.eql(TD.toKey([c2]));

      const p1 = D({ code: 'C', path: ['p', 'x'], range: [1, 2] as const });
      const p2 = D({ code: 'C', path: ['p', 'y'], range: [1, 2] as const });
      expect(TD.toKey([p1])).not.to.eql(TD.toKey([p2]));

      const r1 = D({ code: 'C', path: ['p'], range: [1, 2] as const });
      const r2 = D({ code: 'C', path: ['p'], range: [1, 3] as const });
      expect(TD.toKey([r1])).not.to.eql(TD.toKey([r2]));
    });
  });

  /**
   * Integration-lite: proper hook rendering with renderHook + act.
   * We toggle YAML between "valid" and "invalid" to force key changes.
   */
  describe('useSlugDiagnostics: renderHook', () => {
    type Args = Parameters<typeof useSlugDiagnostics>;
    type Props = { args: Args };

    const validYamlText = Str.dedent(`
      hello: 123
      foo:
        id: example-slug
        traits:
          - as: primary
            id: video
        props:
          primary:
            src: "video.mp4"
    `);

    // Deliberately broken YAML to trigger parser diagnostics.
    const invalidYamlText = Str.dedent(`
      hello: [
    `);

    it('typing: returns UseSlugDiagnosticsResult', () => {
      const initial: Props = {
        args: [registry, undefined, makeEditorYamlFromText(validYamlText, 1)],
      };

      const { result, unmount } = renderHook((p: Props) => useSlugDiagnostics(...p.args), {
        initialProps: initial,
      });

      expectTypeOf(result.current).toEqualTypeOf<t.UseSlugDiagnosticsResult>();
      expectTypeOf(result.current.diagnostics).toEqualTypeOf<readonly t.Yaml.Diagnostic[]>();
      unmount();
    });

    it('rev stable when diagnostics unchanged; bumps when diagnostics change', () => {
      const initial: Props = {
        args: [registry, undefined, makeEditorYamlFromText(validYamlText, 1)],
      };

      const { result, rerender, unmount } = renderHook(
        (p: Props) => useSlugDiagnostics(...p.args),
        {
          initialProps: initial,
        },
      );

      const rev0 = result.current.rev;
      const diag0 = result.current.diagnostics;
      const key0 = TD.toKey(diag0);

      // Same content, new container rev → NO key change
      act(() => {
        rerender({ args: [registry, undefined, makeEditorYamlFromText(validYamlText, 2)] });
      });

      const rev1 = result.current.rev;
      const diag1 = result.current.diagnostics;
      const key1 = TD.toKey(diag1);

      expect(rev1).to.eql(rev0); // content-identical
      expect(diag1).to.equal(diag0); // referentially stable when key unchanged
      expect(key1).to.eql(key0);

      // Switch to invalid YAML → diagnostics change → key changes → rev bumps
      act(() => {
        rerender({ args: [registry, undefined, makeEditorYamlFromText(invalidYamlText, 3)] });
      });

      const rev2 = result.current.rev;
      const diag2 = result.current.diagnostics;
      const key2 = TD.toKey(diag2);

      expect(rev2).to.be.greaterThan(rev1);

      expect(key2).not.to.eql(key0); // content signature changed
      expect(diag2.length).to.be.greaterThan(0); // there are parse diagnostics

      // Back to valid YAML → key returns to baseline signature
      act(() => {
        rerender({ args: [registry, undefined, makeEditorYamlFromText(validYamlText, 4)] });
      });

      const rev3 = result.current.rev;
      const diag3 = result.current.diagnostics;
      const key3 = TD.toKey(diag3);

      expect(rev3).to.be.greaterThan(rev2);
      expect(key3).to.eql(key0); // back to baseline content signature
      expect(diag3.length).to.eql(diag0.length); // counts match baseline (may be > 0)
      unmount();
    });
  });
});
