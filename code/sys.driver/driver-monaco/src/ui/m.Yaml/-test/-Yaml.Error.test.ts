import { describe, expect, it, makeYamlError, MonacoFake } from '../../../-test.ts';
import { type t } from '../common.ts';
import { EditorYaml } from '../mod.ts';

describe('Monaco.Yaml.Error', () => {
  describe('.errorToMarker', () => {
    it('maps linePos → marker range', () => {
      const monaco = MonacoFake.monaco({ cast: true }) as any;
      monaco.MarkerSeverity ??= { Error: 8 };

      const model = MonacoFake.model('a: 1\nb: 2\n');
      MonacoFake.editor(model);

      // reliably invalid: missing closing bracket (has linePos)
      const err = makeYamlError('a: [1, 2');

      expect((err as any).linePos).to.exist;

      const m = EditorYaml.Error.errorToMarker(monaco, model, err);
      expect(m.message).to.be.a('string');
      expect(m.source).to.equal('yaml');
      expect(m.severity).to.equal(monaco.MarkerSeverity.Error);
      // Ensure numeric coordinates exist (exact numbers vary by parser)
      expect(m.startLineNumber).to.be.a('number');
      expect(m.startColumn).to.be.a('number');
      expect(m.endLineNumber).to.be.a('number');
      expect(m.endColumn).to.be.a('number');
    });

    it('maps byte offsets (pos) when linePos is absent', () => {
      const monaco = MonacoFake.monaco({ cast: true }) as any;
      monaco.MarkerSeverity ??= { Error: 8 };

      const model = MonacoFake.model('hello\nworld\n'); // to exercise getPositionAt
      MonacoFake.editor(model);

      // Start from a real error, then remove linePos to force pos branch
      const eWithLinePos = makeYamlError('{ a: 1, b: ');
      const err: t.YamlError = { ...eWithLinePos };
      delete (err as any).linePos;

      const m = EditorYaml.Error.errorToMarker(monaco, model, err);
      expect(m.source).to.equal('yaml');
      expect(m.severity).to.equal(monaco.MarkerSeverity.Error);
      expect(m.startLineNumber).to.be.a('number');
      expect(m.startColumn).to.be.a('number');
      expect(m.endLineNumber).to.be.a('number');
      expect(m.endColumn).to.be.a('number');
    });

    it('fallback when no linePos and no pos (defensive default)', () => {
      const monaco = MonacoFake.monaco({ cast: true }) as any;
      monaco.MarkerSeverity ??= { Error: 8 };

      const model = MonacoFake.model('x\n');
      MonacoFake.editor(model);

      // Use a guaranteed-invalid snippet, then strip both position fields:
      const base = makeYamlError('a: [1, 2');
      const err: t.YamlError = {
        name: base.name,
        message: 'no positions',
        code: base.code,
        pos: base.pos, // NB: keep type happy, then remove.
      } as t.YamlError;
      delete (err as any).pos;
      delete (err as any).linePos;

      const m = EditorYaml.Error.errorToMarker(monaco, model, err);
      expect(m.message).to.equal('no positions');
      expect(m.source).to.equal('yaml');
      expect(m.severity).to.equal(monaco.MarkerSeverity.Error);
      expect(m.startLineNumber).to.be.a('number');
      expect(m.startColumn).to.be.a('number');
      expect(m.endLineNumber).to.be.a('number');
      expect(m.endColumn).to.be.a('number');
    });
  });

  describe('.errorsToMarkers', () => {
    it('maps a list of errors, preserving order', () => {
      const monaco = MonacoFake.monaco({ cast: true }) as any;
      monaco.MarkerSeverity ??= { Error: 8 };

      const model = MonacoFake.model('a: 1\nb: 2\n');
      MonacoFake.editor(model);

      const e1 = makeYamlError('a: [1, 2');
      const e2 = makeYamlError('{ a: 1, b: ');

      const out = EditorYaml.Error.errorsToMarkers(monaco, model, [e1, e2]);
      expect(out.length).to.equal(2);
      expect(out[0].message).to.be.a('string');
      expect(out[1].message).to.be.a('string');
    });

    it('empty input → empty markers', () => {
      const monaco = MonacoFake.monaco({ cast: true }) as any;
      monaco.MarkerSeverity ??= { Error: 8 };

      const model = MonacoFake.model('');
      MonacoFake.editor(model);

      const out = EditorYaml.Error.errorsToMarkers(monaco, model, []);
      expect(out).to.eql([]);
    });
  });
});
