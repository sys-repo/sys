import {
  type t,
  act,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  makeYamlErrorLinePos,
  MonacoFake,
  renderHook,
} from '../../../-test.ts';
import { useErrorMarkers } from '../mod.ts';

describe('useErrorMarkers', () => {
  DomMock.polyfill();

  it('type: matches UseYamlErrorMarkers', () => {
    expectTypeOf(useErrorMarkers).toEqualTypeOf<t.UseYamlErrorMarkers>();
  });

  describe('core behavior (single-instance)', () => {
    it('early return when monaco/editor/enabled not satisfied', () => {
      // 1. No monaco/editor: should be a no-op (just ensure it doesn't throw).
      const { result: a } = renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco: undefined, editor: undefined, errors: [] },
      });
      expect(a).to.not.equal(undefined);

      // 2. monaco present but enabled=false with no editor: still no work.
      const monaco = MonacoFake.monaco({ cast: true });
      const { result: b } = renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor: undefined, enabled: false, errors: [] },
      });
      expect(b).to.not.equal(undefined);
    });

    it('applies markers from linePos (best case)', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('key: value\nfoo: bar\n');
      const editor = MonacoFake.editor(model);
      const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

      const err = makeYamlErrorLinePos('Unexpected token', 2, 4, 10, 'UNEXPECTED_TOKEN');

      renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [err] },
      });

      expect(spy.calls.length).to.equal(1);
      const markers = getMarkersArg(spy.calls[0]);
      expect(markers.length).to.equal(1);

      const m = markers[0]!;
      expect(m.message).to.equal('Unexpected token');
      expect(m.code).to.equal('UNEXPECTED_TOKEN');
      expect(m.source).to.equal('yaml');
      expect(m.severity).to.equal(monaco.MarkerSeverity.Error);
      expect(m.startLineNumber).to.equal(2);
      expect(m.startColumn).to.equal(4);
      expect(m.endLineNumber).to.equal(2);
      expect(m.endColumn).to.equal(10);

      spy.restore();
    });

    it('falls back to character offsets (pos) when linePos missing', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('a\nbc\n');
      const editor = MonacoFake.editor(model);
      const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

      const err: t.YamlError = {
        name: 'YAMLParseError',
        code: 'BAD_INDENT',
        message: 'Bad indentation',
        pos: [2, 4],
      };

      renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [err] },
      });

      expect(spy.calls.length).to.equal(1);
      const markers = getMarkersArg(spy.calls[0]);
      expect(markers.length).to.equal(1);

      const m = markers[0]!;
      expect(m.message).to.equal('Bad indentation');
      expect(m.startLineNumber).to.be.a('number');
      expect(m.startColumn).to.be.a('number');
      expect(m.endLineNumber).to.be.a('number');
      expect(m.endColumn).to.be.a('number');

      spy.restore();
    });

    it('clears markers when errors = []', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('x: 1');
      const editor = MonacoFake.editor(model);
      const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

      const err = makeYamlErrorLinePos('Oops', 1, 1, 2, 'UNEXPECTED_TOKEN');

      const { rerender } = renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [err] },
      });

      expect(spy.calls.length).to.equal(1);
      let markers = getMarkersArg(spy.calls[0]);
      expect(markers.length).to.equal(1);

      act(() => {
        rerender({ monaco, editor, errors: [] });
      });

      expect(spy.calls.length).to.equal(2);
      markers = getMarkersArg(spy.calls[1]);
      expect(markers.length).to.equal(0);

      spy.restore();
    });

    it('clears markers when enabled toggles to false', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('k: v');
      const editor = MonacoFake.editor(model);
      const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

      const err = makeYamlErrorLinePos('Something wrong', 3, 1, 5, 'UNEXPECTED_TOKEN');

      const { rerender } = renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [err], enabled: true },
      });

      expect(spy.calls.length).to.equal(1);
      let markers = getMarkersArg(spy.calls[0]);
      expect(markers.length).to.equal(1);

      act(() => {
        rerender({ monaco, editor, errors: [err], enabled: false });
      });

      expect(spy.calls.length).to.equal(2);
      markers = getMarkersArg(spy.calls[1]);
      expect(markers.length).to.equal(0);

      spy.restore();
    });

    it('cleans up on unmount (owner-scoped)', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('a: 1');
      const editor = MonacoFake.editor(model);

      const owner = 'yaml.unmount';
      const err = makeYamlErrorLinePos('Boom', 1, 1, 2, 'UNEXPECTED_TOKEN');

      const { unmount } = renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [err], owner },
      });

      expect(monaco.editor.getModelMarkers({ owner, resource: model.uri }).length).to.equal(1);

      unmount();
      expect(monaco.editor.getModelMarkers({ owner, resource: model.uri }).length).to.equal(0);
    });

    it('re-applies on model swap and isolates between old/new models', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const modelA = MonacoFake.model('a: 1');
      const modelB = MonacoFake.model('b: 2');

      const editor = MonacoFake.editor(modelA);
      const owner = 'yaml.swap';
      const err = makeYamlErrorLinePos('SwapMe', 1, 1, 2, 'UNEXPECTED_TOKEN');

      const { rerender } = renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [err], owner, enabled: true },
      });

      expect(monaco.editor.getModelMarkers({ owner, resource: modelA.uri }).length).to.equal(1);
      expect(monaco.editor.getModelMarkers({ owner, resource: modelB.uri }).length).to.equal(0);

      // swap
      const editorOnB = MonacoFake.editor(modelB);
      rerender({ monaco, editor: editorOnB, errors: [err], owner, enabled: true });

      expect(monaco.editor.getModelMarkers({ owner, resource: modelA.uri }).length).to.equal(0);
      expect(monaco.editor.getModelMarkers({ owner, resource: modelB.uri }).length).to.equal(1);
    });
  });

  describe('ownership (multi-instance)', () => {
    const getOwnerFrom = (call: { args: unknown[] }) => call.args[1] as string;

    it('auto-generates a unique owner when omitted (two instances, same editor)', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('a: 1\nb: 2\n');
      const editor = MonacoFake.editor(model);
      const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

      const errA = makeYamlErrorLinePos('A', 1, 1, 2, 'UNEXPECTED_TOKEN');
      const errB = makeYamlErrorLinePos('B', 2, 1, 2, 'BAD_INDENT');

      renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [errA] },
      });
      renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [errB] },
      });

      expect(spy.calls.length).to.be.greaterThanOrEqual(2);

      const owners = new Set(spy.calls.map(getOwnerFrom));
      expect(owners.size).to.equal(2);
      for (const o of owners) {
        const markers = monaco.editor.getModelMarkers({ owner: o, resource: model.uri });
        expect(markers.length).to.equal(1);
      }

      spy.restore();
    });

    it('respects an explicit owner and keeps it stable across rerenders (owner is latched)', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('x: 1');
      const editor = MonacoFake.editor(model);
      const spy = MonacoFake.Spy.forSetModelMarkers(monaco);

      const explicit = 'yaml.main';
      const err = makeYamlErrorLinePos('M', 1, 1, 2, 'UNEXPECTED_TOKEN');

      const { rerender } = renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [err], owner: explicit },
      });

      const owners1 = new Set(spy.calls.map(getOwnerFrom));
      expect(owners1.size).to.equal(1);
      expect([...owners1][0]).to.equal(explicit);

      rerender({ monaco, editor, errors: [err], owner: 'yaml.other' });

      const owners2 = new Set(spy.calls.map(getOwnerFrom));
      expect(owners2.size).to.equal(1);
      expect([...owners2][0]).to.equal(explicit);

      spy.restore();
    });

    it('multiple explicit owners do not collide (additive markers)', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('k: v\nm: n\n');
      const editor = MonacoFake.editor(model);

      const ownerA = 'yaml.a';
      const ownerB = 'yaml.b';

      const errA = makeYamlErrorLinePos('A', 1, 1, 2, 'UNEXPECTED_TOKEN');
      const errB = makeYamlErrorLinePos('B', 2, 1, 2, 'BAD_INDENT');

      renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [errA], owner: ownerA },
      });
      renderHook((p: any) => useErrorMarkers(p), {
        initialProps: { monaco, editor, errors: [errB], owner: ownerB },
      });

      const a1 = monaco.editor.getModelMarkers({ owner: ownerA, resource: model.uri });
      const b1 = monaco.editor.getModelMarkers({ owner: ownerB, resource: model.uri });
      expect(a1.length).to.equal(1);
      expect(b1.length).to.equal(1);
      expect(a1[0]!.message).to.equal('A');
      expect(b1[0]!.message).to.equal('B');
    });
  });
});

/**
 * Helpers:
 */
function getMarkersArg(call: { args: unknown[] }) {
  return call.args[2] as readonly t.Monaco.I.IMarkerData[];
}
