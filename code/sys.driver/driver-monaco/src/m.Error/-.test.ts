import { describe, expect, it } from '../-test.ts';

import { type t, MonacoFake } from '../-test.ts';
import { useErrorMarkers } from '../ui/m.Markers.Error/use.ErrorMarkers.ts';
import { Error } from './m.Error.ts';

describe('Monaco.Error', () => {
  describe('API', () => {
    expect(Error.useErrorMarkers).to.equal(useErrorMarkers);
  });

  describe('toMarkers', () => {
    it('returns empty when no ranges', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('foo: bar', 'yaml');

      const errs: t.Schema.Error[] = [{ kind: 'schema', path: ['foo'], message: 'bad foo' } as any];
      const markers = Error.toMarkers(model, errs);
      expect(markers).to.eql([]);
    });

    it('creates marker from schema error with range', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('a: 1\n', 'yaml');

      const errs: t.Schema.Error[] = [
        {
          kind: 'schema',
          path: ['a'],
          message: 'bad a',
          range: [0, 0, 2], // covers "a:"
        } as any,
      ];
      const markers = Error.toMarkers(model, errs);

      expect(markers.length).to.eql(1);
      const m = markers[0];
      expect(m.message).to.include('bad a');
      expect(m.startLineNumber).to.eql(1);
      expect(m.startColumn).to.be.greaterThan(0);
      expect(m.endLineNumber).to.eql(1);
    });

    it('creates marker from yaml error with range', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('id: [unclosed', 'yaml');

      const errs: t.Schema.Error[] = [
        {
          kind: 'yaml',
          path: [],
          message: 'unclosed',
          range: [4, 5, 12],
          yaml: { name: 'YAMLError', code: 'PARSE_ERR', pos: [4], message: 'unclosed' },
        } as any,
      ];
      const markers = Error.toMarkers(model, errs);

      expect(markers.length).to.eql(1);
      expect(markers[0].message).to.include('unclosed');
    });

    it('works with editor arg (not just model)', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('x: 1\n', 'yaml');
      const editor = MonacoFake.editor(model);

      const errs: t.Schema.Error[] = [
        {
          kind: 'schema',
          path: ['x'],
          message: 'oops',
          range: [0, 0, 3],
        } as any,
      ];
      const markers = Error.toMarkers(editor, errs);

      expect(markers.length).to.eql(1);
      expect(markers[0].message).to.eql('oops');
    });

    it('derives markers from byte offsets (pos)', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('abc\ndef', 'yaml'); // "def" starts at offset 4

      const errs: t.EditorDiagnostic[] = [{ message: 'pos err', pos: [4, 6] }];
      const m = Error.toMarkers(model, errs as any)[0];

      expect(m.message).to.eql('pos err');
      expect(m.startLineNumber).to.eql(2);
      expect(m.startColumn).to.eql(1);
      expect(m.endLineNumber).to.eql(2);
      expect(m.endColumn).to.eql(3); // covers "de"
    });

    it('derives markers from linePos and preserves zero-length ranges', () => {
      const model = MonacoFake.model('foo\nbar\n');
      const errs: t.EditorDiagnostic[] = [
        {
          message: 'lp err',
          linePos: [
            { line: 2, col: 2 },
            { line: 2, col: 2 },
          ],
        },
      ];

      const m = Error.toMarkers(model, errs as any)[0];
      expect(m.startLineNumber).to.eql(2);
      expect(m.startColumn).to.eql(2);
      expect(m.endLineNumber).to.eql(2);
      expect(m.endColumn).to.eql(m.startColumn);
    });

    it('derives markers from linePos and preserves zero-length ranges', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('foo\nbar\n', 'yaml');

      // Single/identical tuple → zero-length at the same point:
      const errs: t.EditorDiagnostic[] = [
        {
          message: 'lp err',
          linePos: [
            { line: 2, col: 2 },
            { line: 2, col: 2 },
          ],
        },
      ];
      const m = Error.toMarkers(model, errs as any)[0];

      expect(m.startLineNumber).to.eql(2);
      expect(m.startColumn).to.eql(2);

      // End must be → start (projector guarantees it):
      expect(m.endLineNumber).to.eql(2);
      expect(m.endColumn).to.eql(m.startColumn);
    });

    it('prefers range > pos > linePos when multiple are present', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('abcdefghij', 'yaml');

      const errs: t.EditorDiagnostic[] = [
        {
          message: 'priority',
          range: [2, 5], // should win
          pos: [0, 2],
          linePos: [
            { line: 1, col: 1 },
            { line: 1, col: 2 },
          ],
        },
      ];
      const m = Error.toMarkers(model, errs as any)[0];

      // range [2,5] → offsets 2..5
      expect(m.startColumn).to.eql(model.getPositionAt(2).column);
      expect(m.endColumn).to.eql(model.getPositionAt(5).column);
    });

    it('skips diagnostics without any location', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('foo', 'yaml');

      const errs: t.EditorDiagnostic[] = [{ message: 'no loc' }];
      expect(Error.toMarkers(model, errs as any)).to.eql([]);
    });

    it('coerces numeric code to string', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('abc', 'yaml');

      const errs: t.EditorDiagnostic[] = [{ message: 'c', range: [0, 1], code: 123 }];
      const m = Error.toMarkers(model, errs as any)[0];

      expect(m.code).to.eql('123');
    });

    it('preserves diagnostic order', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('abcdef', 'yaml');

      const errs: t.EditorDiagnostic[] = [
        { message: 'first', range: [0, 1] },
        { message: 'second', range: [2, 3] },
      ];
      const markers = Error.toMarkers(model, errs as any);
      expect(markers.map((m) => m.message)).to.eql(['first', 'second']);
    });

    it('defensively widens inverted ranges', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('xyz', 'yaml');

      const errs: t.EditorDiagnostic[] = [{ message: 'invert', range: [2, 1] as any }];
      const m = Error.toMarkers(model, errs as any)[0];
      expect(m.endColumn).to.be.greaterThan(m.startColumn);
    });

    it('maps Diagnostic.severity → MarkerSeverity and defaults to Error', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('abc', 'yaml');

      const sev = ['Error', 'Warning', 'Info', 'Hint'] as const;
      const errs = sev.map((s) => ({ message: s, range: [0, 1] as [number, number], severity: s }));
      const [e, w, i, h] = Error.toMarkers(model, errs);

      expect(e.severity).to.eql(8);
      expect(w.severity).to.eql(4);
      expect(i.severity).to.eql(2);
      expect(h.severity).to.eql(1);

      const def = Error.toMarkers(model, [{ message: 'd', range: [1, 2] }])[0];
      expect(def.severity).to.eql(8);
    });

    it('prefers range[2] (nodeEnd) when present', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('abcdefgh', 'yaml');
      const m = Error.toMarkers(model, [{ message: 'x', range: [2, 4, 6] }])[0];
      expect(m.startColumn).to.eql(model.getPositionAt(2).column);
      expect(m.endColumn).to.eql(model.getPositionAt(6).column); // not 4
    });

    it('widens when only start is provided (range/pos)', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('abc', 'yaml');

      const [mr] = Error.toMarkers(model, [{ message: 'r', range: [1] as any }]);
      expect(mr.endColumn).to.be.greaterThan(mr.startColumn);

      const [mp] = Error.toMarkers(model, [{ message: 'p', pos: [2] as any }]);
      expect(mp.endColumn).to.be.greaterThan(mp.startColumn);
    });
  });
});
