import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Spy } from '../m.Spy.ts';
import { MonacoFake } from '../mod.ts';

type IMarkerData = t.Monaco.I.IMarkerData;

describe('Spy', () => {
  describe('Spy.forSetModelMarkers', () => {
    it('wraps, records calls (args), exposes markers, restores original', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const original = monaco.editor.setModelMarkers;

      const model = MonacoFake.model('foo: 1\nbar: 2\n');
      MonacoFake.editor(model);

      const spy = Spy.forSetModelMarkers(monaco);

      expect(monaco.editor.setModelMarkers).to.not.equal(original);

      const m1: IMarkerData = {
        message: 'first',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
        severity: monaco.MarkerSeverity.Warning,
      };
      monaco.editor.setModelMarkers(model, 'owner-1', [m1]);

      const m2a: IMarkerData = {
        message: 'second-a',
        startLineNumber: 2,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 4,
        severity: monaco.MarkerSeverity.Error,
      };
      const m2b: IMarkerData = {
        message: 'second-b',
        startLineNumber: 3,
        startColumn: 1,
        endLineNumber: 3,
        endColumn: 5,
        severity: monaco.MarkerSeverity.Info,
      };
      monaco.editor.setModelMarkers(model, 'owner-2', [m2a, m2b]);

      expect(spy.calls.length).to.equal(2);
      expect(spy.calls[0].args[0]).to.equal(model);
      expect(spy.calls[0].args[1]).to.equal('owner-1');
      expect(spy.calls[1].args[1]).to.equal('owner-2');

      const last = spy.getMarkers();
      expect(last).to.eql([m2a, m2b]);

      const first = spy.getMarkers(0);
      expect(first).to.eql([m1]);

      const none = spy.getMarkers(999);
      expect(none).to.eql([]);

      // Type surface (real types) – use toEqualTypeOf with your noop matcher
      expectTypeOf(spy.calls).toEqualTypeOf<
        readonly { readonly args: Parameters<t.Monaco.Monaco['editor']['setModelMarkers']> }[]
      >();
      expectTypeOf(spy.getMarkers()).toEqualTypeOf<readonly IMarkerData[]>();

      spy.restore();
      expect(monaco.editor.setModelMarkers).to.equal(original);

      monaco.editor.setModelMarkers(model, 'owner-3', []);
      expect(spy.calls.length).to.equal(2);
      expect(spy.getMarkers()).to.eql([m2a, m2b]);
    });

    it('independent spies on different monaco instances do not leak', () => {
      const monacoA = MonacoFake.monaco({ cast: true });
      const monacoB = MonacoFake.monaco({ cast: true });

      const modelA = MonacoFake.model('a: 1');
      const modelB = MonacoFake.model('b: 2');

      MonacoFake.editor(modelA);
      MonacoFake.editor(modelB);

      const spyA = Spy.forSetModelMarkers(monacoA);
      const spyB = Spy.forSetModelMarkers(monacoB);

      const markerA: IMarkerData = {
        message: 'A',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
        severity: monacoA.MarkerSeverity.Warning,
      };
      const markerB: IMarkerData = {
        message: 'B',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
        severity: monacoB.MarkerSeverity.Error,
      };

      monacoA.editor.setModelMarkers(modelA, 'owner-A', [markerA]);
      monacoB.editor.setModelMarkers(modelB, 'owner-B', [markerB]);

      expect(spyA.calls.length).to.equal(1);
      expect(spyB.calls.length).to.equal(1);

      expect(spyA.getMarkers()).to.eql([markerA]);
      expect(spyB.getMarkers()).to.eql([markerB]);

      spyA.restore();
      spyB.restore();
    });

    it('does not disturb unrelated editor APIs', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const model = MonacoFake.model('');
      const editor = MonacoFake.editor(model);

      // Capture stable references before spying.
      const execRef = editor.executeEdits;
      const getPosRef = editor.getPosition;
      const setPosRef = editor.setPosition;
      const onDidChangeModelRef = editor.onDidChangeModel;

      // Sanity: these work before spying.
      const beforeExec = editor.executeEdits('test', []);
      const beforePos = editor.getPosition();
      editor.setPosition({ lineNumber: 1, column: 1 });
      const afterSetPos = editor.getPosition();
      expect(afterSetPos).to.eql({ lineNumber: 1, column: 1 });

      // Start spying on setModelMarkers only.
      const spy = Spy.forSetModelMarkers(monaco);

      // References remain identical (no collateral monkey-patching).
      expect(editor.executeEdits).to.equal(execRef);
      expect(editor.getPosition).to.equal(getPosRef);
      expect(editor.setPosition).to.equal(setPosRef);
      expect(editor.onDidChangeModel).to.equal(onDidChangeModelRef);

      // Behavior remains intact.
      const afterExec = editor.executeEdits('test', []);
      expect(afterExec).to.equal(beforeExec);

      editor.setPosition({ lineNumber: 2, column: 3 });
      expect(editor.getPosition()).to.eql({ lineNumber: 2, column: 3 });

      // Event API remains callable and wired.
      let didChangeCount = 0;
      const dispose = editor.onDidChangeModel(() => didChangeCount++);
      editor._emitDidChangeModel();
      expect(didChangeCount).to.equal(1);
      dispose.dispose?.();

      spy.restore();
    });
  });
});
