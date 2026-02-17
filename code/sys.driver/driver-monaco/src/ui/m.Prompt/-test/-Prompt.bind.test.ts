import { describe, expect, it, MonacoFake } from '../../../-test.ts';
import { EditorPrompt } from '../mod.ts';

describe('Monaco.Prompt', () => {
  describe('bind', () => {
    it('tracks line-count transitions and stops after dispose', async () => {
      const model = MonacoFake.model('one');
      const editor = MonacoFake.editor(model);
      const states: number[] = [];

      const life = await EditorPrompt.bind({
        editor,
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
        config: { lines: { min: 1, max: 2 }, overflow: 'scroll' },
      });

      const first = editor._getUpdateOptionsCalls().at(-1) as any;
      expect(first.minimap?.enabled).to.eql(false);
      expect(first.lineNumbers).to.eql('off');
      expect(first.scrollbar?.vertical).to.eql('hidden');

      model.setValue('one\ntwo\nthree');
      const over = editor._getUpdateOptionsCalls().at(-1) as any;
      expect(over.scrollbar?.vertical).to.eql('visible');

      life.dispose();
    });
  });
});
