import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { MonacoFake } from '../mod.ts';

describe('TestFake: Monaco (global API)', () => {
  describe('make - overloaded', () => {
    it('returns FakeMonacoGlobal by default', () => {
      const monaco = MonacoFake.monaco();
      expectTypeOf(monaco).toEqualTypeOf<t.FakeMonacoGlobal>();
    });

    it('returns Monaco.Monaco when { cast:true }', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      expectTypeOf(monaco).toEqualTypeOf<t.Monaco.Monaco>();
    });

    it('returns FakeMonacoGlobal when { cast:false }', () => {
      const monaco = MonacoFake.monaco({ cast: false });
      expectTypeOf(monaco).toEqualTypeOf<t.FakeMonacoGlobal>();
    });
  });

  describe('Uri', () => {
    it('parse: scheme, path, query, toString()', () => {
      const m = MonacoFake.monaco();
      const uri = m.Uri.parse('crdt:id/alpha/beta?x=1&y=2');

      expect(uri.scheme).to.eql('crdt');
      expect(uri.path).to.eql('id/alpha/beta');
      expect(uri.query).to.eql('x=1&y=2');
      expect(uri.toString()).to.eql('crdt:/id/alpha/beta?x=1&y=2');
    });

    it('from: constructs from parts and normalizes slashes', () => {
      const m = MonacoFake.monaco();
      const uri = m.Uri.from({ scheme: 'crdt', path: '/id/xyz', query: 'a=b' });

      expect(uri.scheme).to.eql('crdt');
      expect(uri.path).to.eql('id/xyz'); // leading slash stripped
      expect(uri.query).to.eql('a=b');
      expect(uri.toString()).to.eql('crdt:/id/xyz?a=b');
    });
  });

  describe('languages.registerLinkProvider | _provideLinks', () => {
    it('stores provider and invokes it via _provideLinks', () => {
      const m = MonacoFake.monaco();

      let called = 0;
      const linksOut: t.Monaco.I.ILink[] = [
        {
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 4 },
          url: m.Uri.from({ scheme: 'crdt', path: 'id/a' }),
        },
      ];
      const provider = {
        provideLinks(_model: t.Monaco.TextModel): t.Monaco.I.ILinksList {
          called++;
          return { links: linksOut };
        },
      };

      const d = m.languages.registerLinkProvider('yaml', provider);

      // Minimal model stub (provider ignores it in this test).
      const model = {} as unknown as t.Monaco.TextModel;

      const list = m.languages._provideLinks('yaml', model);
      expect(called).to.eql(1);
      expect(list?.links).to.eql(linksOut);

      d.dispose();
    });

    it('dispose removes provider; _provideLinks returns undefined', () => {
      const m = MonacoFake.monaco();
      const d = m.languages.registerLinkProvider('yaml', { provideLinks: () => ({ links: [] }) });
      d.dispose();

      const model = {} as unknown as t.Monaco.TextModel;
      const list = m.languages._provideLinks('yaml', model);
      expect(list).to.be.undefined;
    });

    it('second registration replaces the first for the same language', () => {
      const m = MonacoFake.monaco();
      let a = 0;
      let b = 0;

      m.languages.registerLinkProvider('yaml', {
        provideLinks: () => {
          a++;
          return { links: [] };
        },
      });

      m.languages.registerLinkProvider('yaml', {
        provideLinks: () => {
          b++;
          return { links: [] };
        },
      });

      const model = {} as unknown as t.Monaco.TextModel;
      m.languages._provideLinks('yaml', model);

      expect(a).to.eql(0); // replaced
      expect(b).to.eql(1); // current
    });
  });

  describe('editor.registerLinkOpener | _open', () => {
    it('forwards to opener.open(uri)', () => {
      const m = MonacoFake.monaco();
      let called = 0;
      let seen: t.Monaco.Uri | undefined;

      const sub = m.editor.registerLinkOpener({
        open(uri) {
          called++;
          seen = uri;
          return true;
        },
      });

      const uri = m.Uri.from({ scheme: 'crdt', path: 'id/a/b', query: 'q=1' });
      const result = m.editor._open(uri);

      expect(called).to.eql(1);
      expect(seen?.toString()).to.eql('crdt:/id/a/b?q=1');
      expect(result).to.eql(true);

      sub.dispose();
    });

    it('throws when no opener is registered', () => {
      const m = MonacoFake.monaco();
      const uri = m.Uri.from({ scheme: 'crdt', path: 'z' });
      expect(() => m.editor._open(uri)).to.throw(/No link opener registered/);
    });

    it('dispose removes the opener', () => {
      const m = MonacoFake.monaco();
      const d = m.editor.registerLinkOpener({ open: () => true });
      d.dispose();

      const uri = m.Uri.from({ scheme: 'crdt', path: 'gone' });
      expect(() => m.editor._open(uri)).to.throw(/No link opener registered/);
    });
  });

  describe('create/get model', () => {
    it('creates a model with value, uri, and position', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('hello world', 'plaintext');

      expect(model.getValue()).to.eql('hello world');
      expect(model.uri).to.be.ok;

      const s = model.uri.toString(true);
      expect(s.startsWith('inmemory:')).to.eql(true);
      expect(s).to.include('/model/'); // ← path segment

      // `setValue` updates buffer:
      model.setValue('updated');
      expect(model.getValue()).to.eql('updated');

      // `getPositionAt` returns a position:
      const pos = model.getPositionAt(3);
      expect(pos.lineNumber).to.eql(1);
      expect(pos.column).to.eql(4);
    });

    it('registers created models into the registry', () => {
      const monaco = MonacoFake.monaco();
      const modelA = monaco.editor.createModel('A');
      const modelB = monaco.editor.createModel('B');
      expect(modelA.uri.toString(true)).to.not.eql(modelB.uri.toString(true));

      const all = monaco.editor.getModels();
      expect(all.length).to.eql(2);
      expect(all.map((m) => m.getValue())).to.eql(['A', 'B']);

      const foundA = monaco.editor.getModel(modelA.uri);
      const foundB = monaco.editor.getModel(modelB.uri);
      expect(foundA).to.equal(modelA);
      expect(foundB).to.equal(modelB);
    });

    it('returns null when getModel is called with unknown uri', () => {
      const monaco = MonacoFake.monaco();
      const fakeUri = monaco.Uri.from({ scheme: 'inmemory', path: 'nope' });

      const found = monaco.editor.getModel(fakeUri);
      expect(found).to.equal(null);
    });
  });

  describe('MarkerSeverity', () => {
    it('exposes enum-like constants with expected numeric levels', () => {
      const monaco = MonacoFake.monaco();
      const S = (monaco as any).MarkerSeverity;

      expect(S).to.exist;
      expect(Object.keys(S)).to.eql(['Hint', 'Info', 'Warning', 'Error']);
      expect(S.Hint).to.equal(1);
      expect(S.Info).to.equal(2);
      expect(S.Warning).to.equal(4);
      expect(S.Error).to.equal(8);

      // type-level sanity (literal types, not just number)
      expectTypeOf(S.Error).toEqualTypeOf<8>();
      expectTypeOf(S.Warning).toEqualTypeOf<4>();
    });

    it('round-trips severity via setModelMarkers/getModelMarkers', () => {
      const monaco = MonacoFake.monaco();
      const model = MonacoFake.model('foo: bar');
      const marker: t.Monaco.I.IMarkerData = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 4,
        message: 'demo',
        source: 'test',
        severity: monaco.MarkerSeverity.Warning,
      };

      monaco.editor.setModelMarkers(model, 'owner', [marker]);
      const out = monaco.editor.getModelMarkers({ owner: 'owner', resource: model.uri });

      expect(out.length).to.equal(1);
      expect(out[0]!.severity).to.equal(monaco.MarkerSeverity.Warning);
      expect(out[0]!.source).to.equal('test');
      expect(out[0]!.message).to.equal('demo');
    });
  });

  describe('Markers', () => {
    it('sets and retrieves markers by owner/resource', () => {
      const { editor } = MonacoFake.monaco();
      const model = editor.createModel('abc');
      const marker: t.Monaco.I.IMarkerData = {
        message: 'x',
        severity: 8, // Error
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
      };

      editor.setModelMarkers(model, 'ownerX', [marker]);
      const got = editor.getModelMarkers({ owner: 'ownerX', resource: model.uri });

      expect(got.length).to.eql(1);
      expect(got[0].message).to.eql('x');
    });
  });

  describe('Markers: errors', () => {
    it('sets and retrieves markers', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('foo: bar', 'yaml');

      const marker = {
        severity: 8, // MarkerSeverity.Error
        message: 'YAML syntax error',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 4,
      } as t.Monaco.I.IMarkerData;

      monaco.editor.setModelMarkers(model, 'yaml', [marker]);
      const res = monaco.editor.getModelMarkers({ owner: 'yaml', resource: model.uri });

      expect(res).to.eql([marker]);
    });

    it('clears markers when empty array is set', () => {
      const monaco = MonacoFake.monaco();
      const model = monaco.editor.createModel('foo: bar', 'yaml');

      monaco.editor.setModelMarkers(model, 'yaml', [
        {
          message: 'Err',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 4,
        } as any,
      ]);
      monaco.editor.setModelMarkers(model, 'yaml', []); // clear

      const res = monaco.editor.getModelMarkers({ owner: 'yaml', resource: model.uri });
      expect(res).to.eql([]);
    });
  });
});
