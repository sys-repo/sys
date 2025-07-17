import { describe, expect, it } from '../-test.ts';
import { MonacoFake } from './mod.ts';

describe('MonacoFake (Mock)', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco/test/fake');
    expect(m.MonacoFake).to.equal(MonacoFake);
  });

  describe('ITextModel', () => {
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
  });

  describe('IStandaloneCodeEditor', () => {
    it('exposes its model', () => {
      const model = MonacoFake.model('text');
      const editor = MonacoFake.editor(model);
      expect(editor.getModel()).to.equal(model);
    });

    it('creates from source', () => {
      const src = 'foo: bar';
      const editor = MonacoFake.editor(src);
      const model = editor.getModel();
      expect(model?.getValue()).to.eql(src);
    });

    it('create with no param', () => {
      const editor = MonacoFake.editor();
      const model = editor.getModel();
      expect(model?.getValue()).to.eql('');
    });

    it('notifies cursor listeners on setPosition', () => {
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
});
