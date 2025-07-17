import { describe, expect, it } from '../-test.ts';
import { MonacoFake } from './mod.ts';

describe('MonacoFake (Mock)', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco/test/fake');
    expect(m.MonacoFake).to.equal(MonacoFake);
  });

  describe('ITextModel', () => {
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

    it('maps (line, column) to absolute offset', () => {
      const model = MonacoFake.model('a\nbc\n1234');
      expect(model.getOffsetAt({ lineNumber: 1, column: 1 })).to.equal(0); // 'a'
      expect(model.getOffsetAt({ lineNumber: 2, column: 2 })).to.equal(3); // 'c'
      expect(model.getOffsetAt({ lineNumber: 3, column: 4 })).to.equal(8); // '4'
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
