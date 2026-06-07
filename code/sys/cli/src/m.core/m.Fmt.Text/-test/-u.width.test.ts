import { c, describe, expect, it } from '../../../-test.ts';
import { Cli } from '../../mod.ts';
import { fitWidth, padEnd, visibleWidth } from '../u.width.ts';

describe('Cli.Fmt.Text.width', () => {
  describe('visible width', () => {
    it('measures rendered text after ANSI codes are stripped', () => {
      expect(visibleWidth(c.cyan('cell'))).to.eql(4);
    });
  });

  describe('padding', () => {
    it('pads to a visible target width without counting ANSI codes', () => {
      const input = c.cyan('cell');
      const padded = padEnd(input, 6);

      expect(Cli.stripAnsi(padded)).to.eql('cell  ');
    });
  });

  describe('fitted width', () => {
    it('starts from an explicit width, then caps by max width and subtracts reserve', () => {
      expect(fitWidth({ width: 120, maxWidth: 100, reserve: 12 })).to.eql(88);
      expect(fitWidth({ width: 72, reserve: 12 })).to.eql(60);
    });

    it('uses deterministic fallback width outside terminals', () => {
      expect(fitWidth({ terminal: false, fallbackWidth: 90, reserve: 10 })).to.eql(80);
      expect(fitWidth({ terminal: false, maxWidth: 70 })).to.eql(70);
      expect(fitWidth({ terminal: false })).to.eql(80);
    });

    it('uses measured screen width when terminal output is available', () => {
      const restore = stubScreenWidth(132);

      try {
        expect(fitWidth({ terminal: true, maxWidth: 100, reserve: 7 })).to.eql(93);
      } finally {
        restore();
      }
    });

    it('returns zero when the fitted width falls below the requested minimum', () => {
      expect(fitWidth({ width: 20, reserve: 15, minWidth: 10 })).to.eql(0);
      expect(fitWidth({ width: 30, reserve: 15, minWidth: 10 })).to.eql(15);
    });
  });
});

function stubScreenWidth(width: number): () => void {
  const screen = Cli.Screen as { size: () => { width: number; height: number } };
  const previous = screen.size;
  screen.size = () => ({ width, height: 24 });
  return () => {
    screen.size = previous;
  };
}
