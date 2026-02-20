import { type t, describe, expect, it, MonacoFake, Rx } from '../../../-test.ts';
import { EditorPrompt } from '../mod.ts';

describe('Monaco.Prompt', () => {
  describe('bind', () => {
    it('tracks line-count transitions and stops after dispose', async () => {
      const model = MonacoFake.model('one');
      const editor = MonacoFake.editor(model);
      const states: number[] = [];

      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 21,
        config: { lines: { min: 1, max: 2 }, overflow: 'scroll' },
        onStateChange: (e) => states.push(e.lineCount),
      });

      // Initial prime.
      expect(states).to.eql([1]);
      expect(life.state.visibleLines).to.eql(1);
      expect(life.state.scrolling).to.eql(false);

      model.setValue('one\ntwo');
      expect(states).to.eql([1, 2]);
      expect(life.state.visibleLines).to.eql(2);
      expect(life.state.scrolling).to.eql(false);

      model.setValue('one\ntwo\nthree');
      expect(states).to.eql([1, 2, 3]);
      expect(life.state.visibleLines).to.eql(2);
      expect(life.state.scrolling).to.eql(true);

      const before = states.length;
      life.dispose();
      model.setValue('reset');
      expect(states.length).to.eql(before);
    });

    it('applies editor options and enables vertical scroll only on overflow', async () => {
      const model = MonacoFake.model('one');
      const editor = MonacoFake.editor(model);

      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 21,
        config: { lines: { min: 1, max: 2 }, overflow: 'scroll' },
      });

      const first = editor._getUpdateOptionsCalls().at(-1) as any;
      expect(first.minimap?.enabled).to.eql(false);
      expect(first.lineNumbers).to.eql('off');
      expect(first.quickSuggestions).to.eql(false);
      expect(first.suggestOnTriggerCharacters).to.eql(false);
      expect(first.wordBasedSuggestions).to.eql('off');
      expect(first.parameterHints?.enabled).to.eql(false);
      expect(first.scrollbar?.vertical).to.eql('hidden');

      model.setValue('one\ntwo\nthree');
      const over = editor._getUpdateOptionsCalls().at(-1) as any;
      expect(over.scrollbar?.vertical).to.eql('visible');

      life.dispose();
    });

    it('follows editor model swaps', async () => {
      const a = MonacoFake.model('one', { uri: 'inmemory://m/a' });
      const b = MonacoFake.model('one\ntwo\nthree', { uri: 'inmemory://m/b' });
      const editor = MonacoFake.editor(a);

      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 21,
        config: { lines: { min: 1, max: 2 }, overflow: 'scroll' },
      });

      expect(life.model.uri.toString()).to.eql('inmemory://m/a');
      expect(life.state.scrolling).to.eql(false);

      editor.setModel(b);
      expect(life.model.uri.toString()).to.eql('inmemory://m/b');
      expect(life.state.scrolling).to.eql(true);

      life.dispose();
    });

    it('stops when disposed via passed until input', async () => {
      const model = MonacoFake.model('one');
      const editor = MonacoFake.editor(model);
      const until = Rx.lifecycle();
      const states: number[] = [];

      await EditorPrompt.bind(
        {
          editor,
          lineHeight: 21,
          config: { lines: { min: 1, max: 2 }, overflow: 'scroll' },
          onStateChange: (e) => states.push(e.lineCount),
        },
        until,
      );

      expect(states).to.eql([1]);
      until.dispose();
      model.setValue('one\ntwo\nthree');
      expect(states).to.eql([1]);
    });

    it('uses explicit lineHeight for state height', async () => {
      const editor = MonacoFake.editor('one\ntwo');

      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 30,
        config: { lines: { min: 1, max: 5 }, overflow: 'scroll' },
      });

      expect(life.state.height).to.eql(60);
      life.dispose();
    });

    it('submit policy blocks enter newline and emits submit', async () => {
      const editor = MonacoFake.editor('one');
      const submits: t.EditorPrompt.SubmitEvent[] = [];

      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 21,
        config: {
          lines: { min: 1, max: 3 },
          enter: { onEnter: 'submit', onModifiedEnter: 'newline' },
        },
        onSubmit: (e) => submits.push(e),
      });

      editor._fireKeyDown({ key: 'Enter' });
      expect(editor.getModel()?.getValue()).to.eql('one');
      expect(submits.map((e) => e.text)).to.eql(['one']);
      expect(submits[0].modifiers).to.eql({ shift: false, alt: false, ctrl: false, meta: false });
      life.dispose();
    });

    it('mod+enter follows enter policy and allows newline when configured', async () => {
      const editor = MonacoFake.editor('one');
      editor.setPosition({ lineNumber: 1, column: 4 });

      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 21,
        config: {
          lines: { min: 1, max: 3 },
          enter: { onEnter: 'submit', onModifiedEnter: 'newline' },
        },
      });

      editor._fireKeyDown({ key: 'Enter', metaKey: true });
      expect(editor.getModel()?.getValue()).to.eql('one\n');
      life.dispose();
    });

    it('overflow=clamp blocks newline at max lines', async () => {
      const editor = MonacoFake.editor('one\ntwo');

      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 21,
        config: {
          lines: { min: 1, max: 2 },
          overflow: 'clamp',
          enter: { onEnter: 'newline', onModifiedEnter: 'newline' },
        },
      });

      editor._fireKeyDown({ key: 'Enter' });
      expect(editor.getModel()?.getValue()).to.eql('one\ntwo');
      life.dispose();
    });

    it('disposes key handling with lifecycle', async () => {
      const editor = MonacoFake.editor('one');
      editor.setPosition({ lineNumber: 1, column: 4 });
      const submits: string[] = [];
      const life = await EditorPrompt.bind({
        editor,
        lineHeight: 21,
        config: { lines: { min: 1, max: 2 }, enter: { onEnter: 'submit', onModifiedEnter: 'submit' } },
        onSubmit: (e) => submits.push(e.text),
      });

      life.dispose();
      editor._fireKeyDown({ key: 'Enter' });
      expect(submits).to.eql([]);
      expect(editor.getModel()?.getValue()).to.eql('one\n');
    });
  });
});
