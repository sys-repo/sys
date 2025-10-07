import { type t, describe, expect, it } from '../../-test.ts';
import { RangeUtil } from '../../m.Monaco/u.ts';
import { MonacoFake } from '../mod.ts';

describe('TestFake: Editor', () => {
  describe('model', () => {
    it('exposes its model', () => {
      const model = MonacoFake.model('text');
      const editor = MonacoFake.editor(model);
      expect(editor.getModel()).to.eql(model);
    });

    it('has monotonic editor IDs', () => {
      const model = MonacoFake.model('text');
      const a = MonacoFake.editor();
      const b = MonacoFake.editor(model);
      expect(a.getId()).to.eql(a.getId()); //     Stable on same instance.
      expect(a.getId()).to.not.eql(b.getId()); // Distinct per instance.
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
    const offsetsToRange = (model: t.Monaco.TextModel, s: number, e: number): t.Monaco.I.IRange => {
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
