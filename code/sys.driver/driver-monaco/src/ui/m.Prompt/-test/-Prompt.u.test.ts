import { describe, expect, it } from '../../../-test.ts';
import { normalize } from '../u.normalize.ts';
import { resolveEnterAction, state } from '../u.state.ts';

describe('Monaco.Prompt', () => {
  describe('normalize', () => {
    it('applies defaults', () => {
      const res = normalize();
      expect(res).to.eql({
        lines: { min: 1, max: 1 },
        overflow: 'scroll',
        enter: { onEnter: 'newline', onModifiedEnter: 'newline' },
      });
    });

    it('normalizes line bounds', () => {
      const res = normalize({ lines: { min: 5, max: 2 } });
      expect(res.lines).to.eql({ min: 5, max: 5 });
    });
  });

  describe('state', () => {
    const config = { lines: { min: 2, max: 4 }, overflow: 'scroll' } as const;

    it('enforces min visible lines', () => {
      const res = state({ config, lineCount: 1, lineHeight: 10 });
      expect(res).to.eql({
        lineCount: 1,
        visibleLines: 2,
        atMax: false,
        scrolling: false,
        height: 20,
      });
    });

    it('clamps at max and enables scrolling only after overflow', () => {
      const atMax = state({ config, lineCount: 4, lineHeight: 10 });
      expect(atMax).to.eql({
        lineCount: 4,
        visibleLines: 4,
        atMax: true,
        scrolling: false,
        height: 40,
      });

      const over = state({ config, lineCount: 5, lineHeight: 10 });
      expect(over).to.eql({
        lineCount: 5,
        visibleLines: 4,
        atMax: true,
        scrolling: true,
        height: 40,
      });
    });

    it('keeps scrolling off for overflow=clamp', () => {
      const res = state({
        config: { lines: { min: 1, max: 2 }, overflow: 'clamp' },
        lineCount: 8,
        lineHeight: 10,
      });
      expect(res.scrolling).to.eql(false);
    });
  });

  describe('resolveEnterAction', () => {
    it('maps enter and modified-enter from policy', () => {
      const config = {
        lines: { min: 1, max: 3 },
        enter: { onEnter: 'submit', onModifiedEnter: 'newline' },
      } as const;
      expect(resolveEnterAction({ config, modifiers: {} })).to.eql('submit');
      expect(resolveEnterAction({ config, modifiers: { meta: true } })).to.eql('newline');
    });

    it('does not treat shift/alt as modified-enter', () => {
      const config = {
        lines: { min: 1, max: 3 },
        enter: { onEnter: 'submit', onModifiedEnter: 'newline' },
      } as const;
      expect(resolveEnterAction({ config, modifiers: { shift: true } })).to.eql('submit');
      expect(resolveEnterAction({ config, modifiers: { alt: true } })).to.eql('submit');
    });
  });
});
