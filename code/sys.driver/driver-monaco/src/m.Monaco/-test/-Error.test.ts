import { type t, describe, expect, it, MonacoFake } from '../../-test.ts';
import { Error } from '../m.Error.ts';

describe('Monaco.Error', () => {
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
  });
});
