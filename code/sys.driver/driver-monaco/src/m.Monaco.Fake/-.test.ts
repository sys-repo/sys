import { type t, describe, expect, it } from '../-test.ts';
import { RangeUtil } from '../m.Monaco/u.ts';
import { MonacoFake } from './mod.ts';

describe('MonacoFake (Mock)', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco/test/fake');
    expect(m.MonacoFake).to.eql(MonacoFake);
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
        expect(model.uri).to.eql(custom);
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
        expect(model.getValue()).to.eql('foo');

        model.setValue('bar');
        expect(model.getValue()).to.eql('bar');
      });

      it('fires onDidChangeContent subscribers exactly once per change', () => {
        const model = MonacoFake.model('x');
        let calls = 0;
        const sub = model.onDidChangeContent(() => calls++);

        model.setValue('y');
        model.setValue('z');
        expect(calls).to.eql(2);

        sub.dispose(); // Unsubscribe.
        model.setValue('zz');
        expect(calls).to.eql(2); // No further notifications.
      });
    });

    describe('getOffsetAt', () => {
      it('maps (line, column) to absolute offset', () => {
        const model = MonacoFake.model('a\nbc\n1234');
        expect(model.getOffsetAt({ lineNumber: 1, column: 1 })).to.eql(0); // 'a'
        expect(model.getOffsetAt({ lineNumber: 2, column: 2 })).to.eql(3); // 'c'
        expect(model.getOffsetAt({ lineNumber: 3, column: 4 })).to.eql(8); // '4'
      });
    });

    describe('getPositionAt', () => {
      it('line start, middle, and end positions on a single line', () => {
        const m = MonacoFake.model('abcdef'); // len 6
        expect(m.getPositionAt(0)).to.include({ lineNumber: 1, column: 1 }); // 'a'
        expect(m.getPositionAt(3)).to.include({ lineNumber: 1, column: 4 }); // after 'c'
        expect(m.getPositionAt(6)).to.include({ lineNumber: 1, column: 7 }); // EOL+1
      });

      it('across multiple lines: beginning of each line', () => {
        const m = MonacoFake.model('a\nbc\n1234');
        // Offsets: 'a'(0), '\n'(1), 'b'(2), 'c'(3), '\n'(4), '1'(5)...
        expect(m.getPositionAt(0)).to.include({ lineNumber: 1, column: 1 }); // 'a'
        expect(m.getPositionAt(2)).to.include({ lineNumber: 2, column: 1 }); // 'b'
        expect(m.getPositionAt(5)).to.include({ lineNumber: 3, column: 1 }); // '1'
      });

      it('newline boundary maps to start of next line', () => {
        const m = MonacoFake.model('xy\nz');
        // Offsets: x(0) y(1) \n(2) z(3)
        expect(m.getPositionAt(2)).to.include({ lineNumber: 2, column: 1 }); // exactly at newline
      });

      it('clamps negative offsets to (1,1)', () => {
        const m = MonacoFake.model('hi');
        expect(m.getPositionAt(-10)).to.include({ lineNumber: 1, column: 1 });
      });

      it('clamps past-end to end-of-last-line + 1', () => {
        const m = MonacoFake.model('cat\ndog'); // lengths: 3 + 1 + 3 = 7
        expect(m.getPositionAt(999)).to.include({ lineNumber: 2, column: 4 }); // 'dog' EOL+1
      });

      it('round-trip with getOffsetAt (inverse relationship)', () => {
        const m = MonacoFake.model('alpha\nbravo\ncharlie');

        const equiv = (
          a: { lineNumber: number; column: number },
          b: { lineNumber: number; column: number },
        ) => {
          if (a.lineNumber === b.lineNumber && a.column === b.column) return true;

          // Treat EOL+1 on line N as equivalent to (N+1,1) when newline exists.
          const aIsEolPlus1 = a.column === m.getLineMaxColumn(a.lineNumber);
          const bIsStartOfNext = b.column === 1 && b.lineNumber === a.lineNumber + 1;
          if (aIsEolPlus1 && bIsStartOfNext && a.lineNumber < m.getLineCount()) return true;

          // and vice versa
          const bIsEolPlus1 = b.column === m.getLineMaxColumn(b.lineNumber);
          const aIsStartOfNext = a.column === 1 && a.lineNumber === b.lineNumber + 1;
          if (bIsEolPlus1 && aIsStartOfNext && b.lineNumber < m.getLineCount()) return true;

          return false;
        };

        const cases = [
          { lineNumber: 1, column: 1 },
          { lineNumber: 1, column: 6 }, // EOL+1 of line 1
          { lineNumber: 2, column: 3 },
          { lineNumber: 3, column: 8 }, // EOL+1 of 'charlie'
        ] as const;

        for (const pos of cases) {
          const off = m.getOffsetAt(pos);
          const back = m.getPositionAt(off);
          expect(equiv(pos, back)).to.eql(true);
        }
      });

      it('round-trip near boundaries (offset-1 and offset+1 where valid)', () => {
        const m = MonacoFake.model('a\nbc\n1234');
        // Pick a mid token position: line 3, col 3 → char '2'.
        const pos = { lineNumber: 3, column: 3 };
        const off = m.getOffsetAt(pos); // offset for '2'
        expect(m.getPositionAt(off)).to.include(pos);
        expect(m.getPositionAt(off - 1)).to.include({ lineNumber: 3, column: 2 }); // '1'
        expect(m.getPositionAt(off + 1)).to.include({ lineNumber: 3, column: 4 }); // '3'
      });
    });
    describe('getValueLength', () => {
      it('returns the total character count (including newlines)', () => {
        const src = 'a\nbc\n1234';
        const model = MonacoFake.model(src);
        expect(model.getValueLength()).to.eql(src.length); // 9
      });

      it('updates when the buffer changes via setValue', () => {
        const model = MonacoFake.model('foo');
        expect(model.getValueLength()).to.eql(3);
        model.setValue('bar\nbaz');
        expect(model.getValueLength()).to.eql(7);
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
        expect(calls).to.eql(0);
      });
    });

    describe('line helpers: count, content', () => {
      it('returns the correct line count', () => {
        const src = 'alpha\nbravo\ncharlie';
        const model = MonacoFake.model(src);
        expect(model.getLineCount()).to.eql(3);
      });

      it('returns the exact line content', () => {
        const src = 'one\ntwo\nthree';
        const model = MonacoFake.model(src);
        expect(model.getLineContent(1)).to.eql('one');
        expect(model.getLineContent(2)).to.eql('two');
        expect(model.getLineContent(3)).to.eql('three');
      });

      it('returns an empty string for out-of-range lines', () => {
        const src = 'foo\nbar';
        const model = MonacoFake.model(src);
        expect(model.getLineContent(5)).to.eql('');
      });
    });

    describe('invariants (offsets, lengths, EOL semantics)', () => {
      it('offset ↔ position round-trip (exhaustive over buffer)', () => {
        const src = 'α\nbeta\n\n1234\nz';
        const m = MonacoFake.model(src);

        // Treat EOL+1 on line N as equivalent to (N+1,1) when a newline exists.
        const equiv = (
          a: { lineNumber: number; column: number },
          b: { lineNumber: number; column: number },
        ) => {
          if (a.lineNumber === b.lineNumber && a.column === b.column) return true;

          const isEolPlus1 = (p: { lineNumber: number; column: number }) =>
            p.column === m.getLineMaxColumn(p.lineNumber);

          // a = EOL+1, b = start of next line
          if (
            isEolPlus1(a) &&
            b.column === 1 &&
            b.lineNumber === a.lineNumber + 1 &&
            a.lineNumber < m.getLineCount()
          ) {
            return true;
          }

          // b = EOL+1, a = start of next line
          if (
            isEolPlus1(b) &&
            a.column === 1 &&
            a.lineNumber === b.lineNumber + 1 &&
            b.lineNumber < m.getLineCount()
          ) {
            return true;
          }

          return false;
        };

        for (let off = 0; off <= src.length; off++) {
          const pos = m.getPositionAt(off);
          const back = m.getOffsetAt(pos);
          const backPos = m.getPositionAt(back);
          expect(equiv(pos, backPos), `off=${off} pos=${pos.lineNumber}:${pos.column}`).to.eql(
            true,
          );
        }
      });

      it('getLineMaxColumn == lineContent.length + 1 (before and after mutation)', () => {
        const check = (text: string) => {
          const model = MonacoFake.model(text);
          const lines = text.split('\n');
          for (let ln = 1; ln <= lines.length; ln++) {
            expect(model.getLineMaxColumn(ln)).to.eql(lines[ln - 1].length + 1);
          }
        };

        check('a\nbc\n'); // trailing empty line segment
        check('foo\nbar\nbaz'); // no trailing newline
      });

      it('getValueLength equals sum(line lengths) + (lineCount-1)', () => {
        const mk = (s: string) => {
          const model = MonacoFake.model(s);
          const lines = s.split('\n');
          const expected = lines.reduce((n, l) => n + l.length, 0) + (lines.length - 1);
          expect(model.getValueLength()).to.eql(expected);
        };

        mk('x');
        mk('x\ny');
        mk('one\n\ntwo\nthree');
      });

      it('getPositionAt is monotonic in offset', () => {
        const m = MonacoFake.model('a\nbc\n1234');
        let prev = m.getPositionAt(0);
        for (let off = 1; off <= m.getValueLength(); off++) {
          const cur = m.getPositionAt(off);
          // prev <= cur
          expect(prev.isBeforeOrEqual(cur)).to.eql(true);
          prev = cur;
        }
      });
    });

    describe('onDidChangeModel', () => {
      function getEmit(editor: unknown) {
        const ed = editor as t.FakeEditorFull;
        const fn = ed._emitDidChangeModel;
        expect(typeof fn).to.eql('function', 'fake editor missing emit hook');
        return fn as (evt?: Partial<t.Monaco.I.IModelChangedEvent>) => void;
      }

      it('API: exists and returns a disposable', () => {
        const editor = MonacoFake.editor(MonacoFake.model('x'));
        const sub = editor.onDidChangeModel(() => {});
        expect(sub && typeof sub.dispose).to.eql('function');
        sub.dispose();
      });

      it('invokes listener with event payload (once per emit)', () => {
        const model = MonacoFake.model('x');
        const editor = MonacoFake.editor(model);
        const emit = getEmit(editor);

        let calls = 0;
        let eventSeen: unknown;
        const sub = editor.onDidChangeModel((e) => {
          calls++;
          eventSeen = e;
        });

        emit({ oldModelUrl: model.uri, newModelUrl: model.uri });

        expect(calls).to.eql(1);
        expect(eventSeen).to.be.ok;
        sub.dispose();
      });

      it('binds thisArg correctly', () => {
        const editor = MonacoFake.editor(MonacoFake.model('x'));
        const emit = getEmit(editor);
        const ctx = { tag: 'ctx' } as const;

        let got: unknown;
        const sub = editor.onDidChangeModel(function (this: any) {
          got = this;
        }, ctx);

        emit();
        expect(got).to.eql(ctx);
        sub.dispose();
      });

      it('dispose unsubscribes (no further notifications)', () => {
        const editor = MonacoFake.editor(MonacoFake.model('x'));
        const emit = getEmit(editor);

        let calls = 0;
        const sub = editor.onDidChangeModel(() => {
          calls++;
        });

        emit();
        expect(calls).to.eql(1);

        sub.dispose();
        emit();
        expect(calls).to.eql(1); // unchanged
      });

      it('supports multiple listeners independently', () => {
        const editor = MonacoFake.editor(MonacoFake.model('x'));
        const emit = getEmit(editor);

        let a = 0,
          b = 0;
        const sa = editor.onDidChangeModel(() => {
          a++;
        });
        const sb = editor.onDidChangeModel(() => {
          b++;
        });

        emit();
        expect(a).to.eql(1);
        expect(b).to.eql(1);

        sa.dispose();
        emit();
        expect(a).to.eql(1); // a unsubscribed
        expect(b).to.eql(2); // b still live

        sb.dispose();
      });

      it('is assignable to IEvent<IModelChangedEvent> (1-2 args)', () => {
        const editor = MonacoFake.editor(MonacoFake.model('x'));

        // 1-arg:
        const a = editor.onDidChangeModel(() => {});
        expect(typeof a.dispose).to.eql('function');
        a.dispose();

        // 2-arg (thisArg):
        const ctx = { tag: 'ctx' };
        let seen: unknown;
        const b = editor.onDidChangeModel(function (this: any) {
          seen = this;
        }, ctx);
        editor._emitDidChangeModel?.();
        expect(seen).to.eql(ctx);
        b.dispose();
      });

      it('is safe to emit with no listeners', () => {
        const editor = MonacoFake.editor(MonacoFake.model('x'));
        getEmit(editor)(); // NB: should not throw.
      });
    });
  });

  describe('Editor', () => {
    describe('model', () => {
      it('exposes its model', () => {
        const model = MonacoFake.model('text');
        const editor = MonacoFake.editor(model);
        expect(editor.getModel()).to.eql(model);
      });

      it('has monotonic editor IDs', () => {
        const a = MonacoFake.editor();
        const b = MonacoFake.editor();
        expect(a.getId()).to.eql('e1');
        expect(a.getId()).to.eql('e1'); // NB: stable ID.
        expect(b.getId()).to.eql('e2');
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

      it('accepts a real Monaco.TextModel and shims __setLanguageId', () => {
        const monaco = MonacoFake.monaco();
        const realModel = monaco.editor.createModel('real src', 'yaml');

        // Pass the real model into the fake editor:
        const editor = MonacoFake.editor(realModel);

        // Editor wires through correctly:
        const model = editor.getModel();
        expect(model?.getValue()).to.eql('real src');

        // Shimmed __setLanguageId exists and is callable:
        expect(typeof (model as any).__setLanguageId).to.eql('function');
        (model as any).__setLanguageId('typescript'); // no-op shim.
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
        expect(fired).to.eql(1);
        expect(editor.getHiddenAreas()).to.eql([range]);
      });

      it('is idempotent when the same ranges are passed', () => {
        const editor = MonacoFake.editor('alpha\nbeta');
        const r: t.Monaco.I.IRange = { ...range, endLineNumber: 2 }; // different range for clarity
        let fired = 0;
        editor.onDidChangeHiddenAreas(() => fired++);
        editor.setHiddenAreas([r]);
        editor.setHiddenAreas([r]); // same → no extra event
        expect(fired).to.eql(1);
      });

      it('clears folds and emits when setHiddenAreas([]) is called', () => {
        const editor = MonacoFake.editor('x\ny');
        const r: t.Monaco.I.IRange = { ...range };
        let fired = 0;
        editor.onDidChangeHiddenAreas(() => fired++);
        editor.setHiddenAreas([r]); // ← fold.
        editor.setHiddenAreas([]); //  ← unfold.
        expect(fired).to.eql(2);
        expect(editor.getHiddenAreas()).to.eql([]);
      });
    });

    describe('executeEdits', () => {
      /**
       * Helper: build an IRange from absolute offsets using RangeUtil.asRange.
       */
      const offsetsToRange = (
        model: t.Monaco.TextModel,
        s: number,
        e: number,
      ): t.Monaco.I.IRange => {
        const p1 = model.getPositionAt(s);
        const p2 = model.getPositionAt(e);
        return RangeUtil.asRange([p1.lineNumber, p1.column, p2.lineNumber, p2.column]);
      };

      it('single replace: updates text and returns true (caret unchanged)', () => {
        const model = MonacoFake.model('hello crdt:abc world', { uri: 'inmemory://m/one' });
        const editor = MonacoFake.editor(model);

        // preset caret; executeEdits should not move it
        editor.setPosition({ lineNumber: 1, column: 1 });
        const beforePos = editor.getPosition();
        expect(beforePos).to.exist;
        const b = beforePos!;

        const old = 'crdt:abc';
        const idx = model.getValue().indexOf(old);
        const range = offsetsToRange(model, idx, idx + old.length);

        const ok = editor.executeEdits('test', [{ range, text: 'crdt:xyz' }]);
        expect(ok).to.eql(true);
        expect(model.getValue()).to.eql('hello crdt:xyz world');

        // caret unchanged
        const afterPos = editor.getPosition();
        expect(afterPos).to.exist;
        const a = afterPos!;
        expect(a.lineNumber).to.eql(b.lineNumber);
        expect(a.column).to.eql(b.column);
      });

      it('multiple edits: uses original ranges (applied right→left)', () => {
        //    0123456789
        // src= 'abcdefghi'
        const model = MonacoFake.model('abcdefghi', { uri: 'inmemory://m/multi' });
        const editor = MonacoFake.editor(model);

        // Replace 'bc' → 'X' (offsets 1..3), and 'fg' → 'YY' (offsets 5..7)
        const r1 = offsetsToRange(model, 1, 3); // 'bc'
        const r2 = offsetsToRange(model, 5, 7); // 'fg'

        const ok = editor.executeEdits('test', [
          { range: r1, text: 'X' },
          { range: r2, text: 'YY' },
        ]);
        expect(ok).to.eql(true);

        // Expected after applying from rightmost first:
        // 'a' + 'X' + 'de' + 'YY' + 'hi'  => 'aXdeYYhi'
        expect(model.getValue()).to.eql('aXdeYYhi');
      });

      it('deletion (empty text) works', () => {
        const model = MonacoFake.model('alpha beta gamma', { uri: 'inmemory://m/del' });
        const editor = MonacoFake.editor(model);

        const idx = model.getValue().indexOf('beta');
        const range = offsetsToRange(model, idx, idx + 'beta'.length);

        const ok = editor.executeEdits('test', [{ range, text: '' }]);
        expect(ok).to.eql(true);
        expect(model.getValue()).to.eql('alpha  gamma'); // two spaces remain (original separators)
      });

      it('insertion (zero-length range) works', () => {
        const model = MonacoFake.model('foo bar', { uri: 'inmemory://m/ins' });
        const editor = MonacoFake.editor(model);

        const insertAt = model.getValue().indexOf(' ') + 1; // after space, before 'bar'
        const range = offsetsToRange(model, insertAt, insertAt); // zero-length

        const ok = editor.executeEdits('test', [{ range, text: 'crdt:123 ' }]);
        expect(ok).to.eql(true);
        expect(model.getValue()).to.eql('foo crdt:123 bar');
      });

      it('mixed edits (insert + replace + delete) committed atomically with original ranges', () => {
        // Lines to exercise newline math too.
        // line1: "one two"
        // line2: "three four"
        const src = ['one two', 'three four'].join('\n');
        const model = MonacoFake.model(src, { uri: 'inmemory://m/mixed' });
        const editor = MonacoFake.editor(model);

        // Prepare ranges on the ORIGINAL text:
        const text = model.getValue(); // "one two\nthree four"

        // Replace "two" → "TWO"
        const pTwo = text.indexOf('two');
        const rReplace = offsetsToRange(model, pTwo, pTwo + 'two'.length);

        // Insert "!!! " at the very start (offset 0)
        const rInsert = offsetsToRange(model, 0, 0);

        // Delete "\nthree" (newline + 'three') starting exactly at the newline
        const pNLThree = text.indexOf('\nthree');
        expect(pNLThree).to.be.greaterThan(-1); // sanity
        const rDelete = offsetsToRange(model, pNLThree, pNLThree + '\nthree'.length);

        const ok = editor.executeEdits('test', [
          { range: rReplace, text: 'TWO' },
          { range: rInsert, text: '!!! ' },
          { range: rDelete, text: '' },
        ]);
        expect(ok).to.eql(true);

        // Apply right → left on original offsets:
        // Start: "one two\nthree four"
        //    1) delete "\nthree" → "one two four"
        //    2) replace "two" → "TWO" → "one TWO four"
        //    3) insert "!!! " at 0 → "!!! one TWO four"
        expect(model.getValue()).to.eql('!!! one TWO four');
      });

      it('does not throw on empty edits array and returns true', () => {
        const model = MonacoFake.model('abc', { uri: 'inmemory://m/empty' });
        const editor = MonacoFake.editor(model);
        const ok = editor.executeEdits('test', []);
        expect(ok).to.eql(true);
        expect(model.getValue()).to.eql('abc');
      });
    });
  });

  describe('Context (Monaco, Editor)', () => {
    it('creates a host with default empty model', () => {
      const ctx = MonacoFake.ctx(); // no args
      expect(ctx).to.have.keys(['monaco', 'editor']);

      const model = ctx.editor.getModel();
      expect(model).to.exist;
      expect(model?.getValue()).to.eql('');
    });

    it('wires editor to the provided model instance', () => {
      const model = MonacoFake.model('foo', { uri: 'inmemory://m/host-1' });
      const ctx = MonacoFake.ctx(model);

      expect(ctx.editor.getModel()).to.eql(model); // same instance
      expect(ctx.editor.getModel()?.getValue()).to.eql('foo');
    });

    it('accepts a string and auto-creates a model for it', () => {
      const ctx = MonacoFake.ctx(MonacoFake.model('alpha').getValue()); // or just 'alpha'
      const model = ctx.editor.getModel();
      expect(model?.getValue()).to.eql('alpha');
    });

    it('provides a fake monaco global compatible with Uri', () => {
      const ctx = MonacoFake.ctx();
      const uri = ctx.monaco.Uri.parse('inmemory://m/test');

      expect(uri.scheme).to.eql('inmemory');

      // Fake preserves authority separately and strips the leading slash from path
      expect((uri as any).authority).to.eql('m');
      expect(uri.path).to.eql('test'); //

      expect(uri.toString()).to.eql('inmemory://m/test');
    });
    it('multiple hosts are independent (no shared editor/model/monaco)', () => {
      const c1 = MonacoFake.ctx(MonacoFake.model('one', { uri: 'inmemory://m/one' }));
      const c2 = MonacoFake.ctx(MonacoFake.model('two', { uri: 'inmemory://m/two' }));

      expect(c1).to.not.equal(c2);
      expect(c1.editor).to.not.equal(c2.editor);
      expect(c1.editor.getModel()).to.not.equal(c2.editor.getModel());
      expect(c1.monaco).to.not.equal(c2.monaco);

      expect(c1.editor.getModel()?.getValue()).to.eql('one');
      expect(c2.editor.getModel()?.getValue()).to.eql('two');
    });

    it('asMonaco/asEditor/asModel return typed views of the same instances', () => {
      const base = MonacoFake.ctx(MonacoFake.model('cast', { uri: 'inmemory://m/cast' }));
      const monaco = MonacoFake.asMonaco(base.monaco);
      const editor = MonacoFake.asEditor(base.editor);
      const model = MonacoFake.asModel(base.editor.getModel()!);

      // Same instance:
      expect(monaco).to.equal(base.monaco);
      expect(editor).to.equal(base.editor);
      expect(model).to.equal(base.editor.getModel());

      // Sanity check on types/behavior still intact:
      const uri = monaco.Uri.from({ scheme: 'inmemory', authority: 'm', path: 'cast' });
      expect(uri.toString()).to.eql('inmemory://m/cast');
      expect(model.getValue()).to.eql('cast');
    });
  });
});
