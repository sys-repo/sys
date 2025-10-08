import { type t, describe, expect, it } from '../../-test.ts';
import { MonacoFake } from '../mod.ts';

describe('TestFake: Model', () => {
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
      it('maps (line, column) to absolute offset (happy path)', () => {
        const model = MonacoFake.model('a\nbc\n1234');
        expect(model.getOffsetAt({ lineNumber: 1, column: 1 })).to.eql(0); // 'a'
        expect(model.getOffsetAt({ lineNumber: 2, column: 2 })).to.eql(3); // 'c'
        expect(model.getOffsetAt({ lineNumber: 3, column: 4 })).to.eql(8); // '4'
      });

      it('clamps line/column within valid bounds', () => {
        const model = MonacoFake.model('a\nbc\n1234');
        // lineNumber clamps to 3; column clamps to 1
        const off = model.getOffsetAt({ lineNumber: 99, column: 1 });
        // Start of last line is offset 5 ('1'); ensure we’re not before it
        expect(off).to.be.greaterThanOrEqual(5);
        // And not beyond end-of-last-line+1
        const lastEolPlus1 = model.getOffsetAt({
          lineNumber: 3,
          column: model.getLineMaxColumn(3),
        });
        expect(off).to.be.lessThanOrEqual(lastEolPlus1);
      });

      it('round-trips with getPositionAt (compare scalars)', () => {
        const model = MonacoFake.model('a\nbc\n1234');
        const p = { lineNumber: 2, column: 2 }; // inside the line
        const off = model.getOffsetAt(p);
        const back = model.getPositionAt(off);
        expect(back.lineNumber).to.eql(p.lineNumber);
        expect(back.column).to.eql(p.column);
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
});
