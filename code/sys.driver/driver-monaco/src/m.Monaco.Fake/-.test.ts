import { type t, describe, expect, it } from '../-test.ts';
import { MonacoFake } from './mod.ts';

describe('MonacoFake (Mock)', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco/test/fake');
    expect(m.MonacoFake).to.equal(MonacoFake);
  });

  describe('Monaco (global)', () => {
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

    describe('languages.registerLinkProvider / _provideLinks', () => {
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

    describe('editor.registerLinkOpener / _open', () => {
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
  });

  describe('TextModel', () => {
    describe('uri', () => {
      it('exposes a stable model URI (default)', () => {
        const model = MonacoFake.model('alpha\nbeta');
        const uri = model.uri;
        expect(uri).to.be.ok;
        expect(typeof uri.toString).to.eql('function');
        expect(uri.toString()).to.eql('inmemory://model/test');

        // Stays stable across mutations:
        model.setValue('gamma\ndelta');
        expect(model.uri.toString()).to.eql('inmemory://model/test');
      });

      it('accepts a custom URI (string)', () => {
        const model = MonacoFake.model('x', { uri: 'inmemory://model/custom-1' });
        expect(model.uri.toString()).to.eql('inmemory://model/custom-1');
      });

      it('accepts a custom URI (Uri-like object)', () => {
        const custom = { toString: () => 'crdt://doc/42' } as unknown as t.Monaco.Uri;
        const model = MonacoFake.model('x', { uri: custom });
        expect(model.uri).to.equal(custom);
        expect(model.uri.toString()).to.eql('crdt://doc/42');
      });

      it('different models have different URIs when provided', () => {
        const a = MonacoFake.model('a', { uri: 'inmemory://model/a' });
        const b = MonacoFake.model('b', { uri: 'inmemory://model/b' });
        expect(a.uri.toString()).to.eql('inmemory://model/a');
        expect(b.uri.toString()).to.eql('inmemory://model/b');
      });
    });

    describe('get/set value', () => {
      it('returns and mutates text via getValue / setValue', () => {
        const model = MonacoFake.model('foo');
        expect(model.getValue()).to.equal('foo');

        model.setValue('bar');
        expect(model.getValue()).to.equal('bar');
      });

      it('fires onDidChangeContent subscribers exactly once per change', () => {
        const model = MonacoFake.model('x');
        let calls = 0;
        const sub = model.onDidChangeContent(() => calls++);

        model.setValue('y');
        model.setValue('z');
        expect(calls).to.equal(2);

        sub.dispose(); // Unsubscribe.
        model.setValue('zz');
        expect(calls).to.equal(2); // No further notifications.
      });
    });

    describe('getOffsetAt', () => {
      it('maps (line, column) to absolute offset', () => {
        const model = MonacoFake.model('a\nbc\n1234');
        expect(model.getOffsetAt({ lineNumber: 1, column: 1 })).to.equal(0); // 'a'
        expect(model.getOffsetAt({ lineNumber: 2, column: 2 })).to.equal(3); // 'c'
        expect(model.getOffsetAt({ lineNumber: 3, column: 4 })).to.equal(8); // '4'
      });
    });

    describe('getValueLength', () => {
      it('returns the total character count (including newlines)', () => {
        const src = 'a\nbc\n1234';
        const model = MonacoFake.model(src);
        expect(model.getValueLength()).to.equal(src.length); // 9
      });

      it('updates when the buffer changes via setValue', () => {
        const model = MonacoFake.model('foo');
        expect(model.getValueLength()).to.equal(3);
        model.setValue('bar\nbaz');
        expect(model.getValueLength()).to.equal(7);
      });
    });

    describe('getLineMaxColumn', () => {
      it('returns (line length + 1) for each line', () => {
        const src = 'a\nbc\n1234';
        const model = MonacoFake.model(src);
        expect(model.getLineMaxColumn(1)).to.eql(2); // 'a'    → len 1 + 1
        expect(model.getLineMaxColumn(2)).to.eql(3); // 'bc'   → len 2 + 1
        expect(model.getLineMaxColumn(3)).to.eql(5); // '1234' → len 4 + 1
      });
    });

    describe('getVersionId', () => {
      it('increments only when the text actually changes', () => {
        const model = MonacoFake.model('foo');

        // Initial version starts at 1.
        expect(model.getVersionId()).to.eql(1);

        // Writing the same value → no version bump.
        model.setValue('foo');
        expect(model.getVersionId()).to.eql(1);

        // First real change.
        model.setValue('bar');
        expect(model.getVersionId()).to.eql(2);

        // Second real change.
        model.setValue('baz');
        expect(model.getVersionId()).to.eql(3);
      });
    });

    describe('language id', () => {
      it('defaults to "plaintext"', () => {
        const model = MonacoFake.model('text');
        expect(model.getLanguageId()).to.eql('UNKNOWN');
      });

      it('setLanguageId updates value and fires onDidChangeLanguage exactly once', () => {
        const model = MonacoFake.model('code');
        let calls = 0;

        const sub = model.onDidChangeLanguage((e) => {
          calls++;
          expect(e.oldLanguage).to.eql('UNKNOWN');
          expect(e.newLanguage).to.eql('javascript');
        });

        model.__setLanguageId('javascript');
        expect(model.getLanguageId()).to.eql('javascript');
        expect(calls).to.eql(1);

        sub.dispose(); // Unsubscribe.
        model.__setLanguageId('typescript');
        expect(calls).to.eql(1); // No further notifications.
      });

      it('ignores no-op setLanguageId calls (same id)', () => {
        const model = MonacoFake.model('code');
        let calls = 0;
        model.onDidChangeLanguage(() => calls++);

        model.__setLanguageId('UNKNOWN'); // same as current
        expect(calls).to.equal(0);
      });
    });

    describe('line helpers: count, content', () => {
      it('returns the correct line count', () => {
        const src = 'alpha\nbravo\ncharlie';
        const model = MonacoFake.model(src);
        expect(model.getLineCount()).to.equal(3);
      });

      it('returns the exact line content', () => {
        const src = 'one\ntwo\nthree';
        const model = MonacoFake.model(src);
        expect(model.getLineContent(1)).to.equal('one');
        expect(model.getLineContent(2)).to.equal('two');
        expect(model.getLineContent(3)).to.equal('three');
      });

      it('returns an empty string for out-of-range lines', () => {
        const src = 'foo\nbar';
        const model = MonacoFake.model(src);
        expect(model.getLineContent(5)).to.equal('');
      });
    });

    describe('getWordAtPosition', () => {
      it('returns null when cursor is on whitespace', () => {
        const model = MonacoFake.model('foo bar');
        const result = model.getWordAtPosition({ lineNumber: 1, column: 4 });
        expect(result).to.be.null;
      });

      it('returns null when cursor is on punctuation', () => {
        const model = MonacoFake.model('foo,bar');
        // column 4 is the comma:
        const result = model.getWordAtPosition({ lineNumber: 1, column: 4 });
        expect(result).to.be.null;
      });

      it('finds a single word correctly', () => {
        const model = MonacoFake.model('unittest');
        // anywhere inside the word:
        const result = model.getWordAtPosition({ lineNumber: 1, column: 5 });
        expect(result).to.eql({
          word: 'unittest',
          startColumn: 1,
          endColumn: 9,
        });
      });

      it('finds word at line start', () => {
        const model = MonacoFake.model('alpha beta');
        // column 1 at the very start:
        const result = model.getWordAtPosition({ lineNumber: 1, column: 1 });
        expect(result).to.eql({
          word: 'alpha',
          startColumn: 1,
          endColumn: 6,
        });
      });

      it('finds word at line end', () => {
        const model = MonacoFake.model('first second');
        // column 13 is the last character of 'second':
        const result = model.getWordAtPosition({ lineNumber: 1, column: 13 });
        expect(result).to.eql({
          word: 'second',
          startColumn: 7,
          endColumn: 13,
        });
      });

      it('handles underscores and digits as part of words', () => {
        const model = MonacoFake.model('var_name1 = 42;');
        // column 5 is inside 'var_name1':
        const result = model.getWordAtPosition({ lineNumber: 1, column: 5 });
        expect(result).to.eql({
          word: 'var_name1',
          startColumn: 1,
          endColumn: 10,
        });
      });
    });
  });

  describe('IStandaloneCodeEditor', () => {
    describe('model', () => {
      it('exposes its model', () => {
        const model = MonacoFake.model('text');
        const editor = MonacoFake.editor(model);
        expect(editor.getModel()).to.equal(model);
      });

      it('creates from "src" string param ← auto model generation', () => {
        const src = 'foo: bar';
        const editor = MonacoFake.editor(src);
        const model = editor.getModel();
        expect(model?.getValue()).to.eql(src);
      });

      it('create with no param (default src="") ← auto model generation', () => {
        const editor = MonacoFake.editor();
        const model = editor.getModel();
        expect(model?.getValue()).to.eql('');
      });
    });

    describe('cursor', () => {
      it('event: notifies cursor listeners on setPosition', () => {
        const model = MonacoFake.model('');
        const editor = MonacoFake.editor(model);

        let pos: { lineNumber: number; column: number } | undefined;
        const sub = editor.onDidChangeCursorPosition((e) => (pos = e.position));

        editor.setPosition({ lineNumber: 2, column: 5 });
        expect(pos).to.eql({ lineNumber: 2, column: 5 });

        sub.dispose(); // unsubscribe
        editor.setPosition({ lineNumber: 3, column: 1 });
        expect(pos).to.eql({ lineNumber: 2, column: 5 }); // NB: unchanged
      });
    });

    describe('folding helpers (hidden areas)', () => {
      const range: t.Monaco.I.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      };

      it('starts with no hidden areas', () => {
        const editor = MonacoFake.editor('');
        expect(editor.getHiddenAreas()).to.eql([]);
      });

      it('fires onDidChangeHiddenAreas when ranges change', () => {
        const editor = MonacoFake.editor('one\ntwo\nthree');
        let fired = 0;
        editor.onDidChangeHiddenAreas(() => fired++);
        editor.setHiddenAreas([range]);
        expect(fired).to.equal(1);
        expect(editor.getHiddenAreas()).to.eql([range]);
      });

      it('is idempotent when the same ranges are passed', () => {
        const editor = MonacoFake.editor('alpha\nbeta');
        const r: t.Monaco.I.IRange = { ...range, endLineNumber: 2 }; // different range for clarity
        let fired = 0;
        editor.onDidChangeHiddenAreas(() => fired++);
        editor.setHiddenAreas([r]);
        editor.setHiddenAreas([r]); // same → no extra event
        expect(fired).to.equal(1);
      });

      it('clears folds and emits when setHiddenAreas([]) is called', () => {
        const editor = MonacoFake.editor('x\ny');
        const r: t.Monaco.I.IRange = { ...range };
        let fired = 0;
        editor.onDidChangeHiddenAreas(() => fired++);
        editor.setHiddenAreas([r]); // ← fold.
        editor.setHiddenAreas([]); //  ← unfold.
        expect(fired).to.equal(2);
        expect(editor.getHiddenAreas()).to.eql([]);
      });
    });
  });
});
