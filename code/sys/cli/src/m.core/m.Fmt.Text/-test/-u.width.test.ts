import { c, describe, expect, it } from '../../../-test.ts';
import { Cli } from '../../mod.ts';
import { fit, max, measure, padEnd } from '../u.width.ts';

describe('Cli.Fmt.Text.Width', () => {
  describe('measurement', () => {
    it('measures rendered text after ANSI codes are stripped', () => {
      expect(measure(c.cyan('cell'))).to.eql(4);
      expect(measure(c.cyan('界'))).to.eql(2);
      expect(measure('\u001B]8;;https://example.com\u0007界\u001B]8;;\u0007')).to.eql(2);
    });

    it('measures terminal cells for wide, combining, and emoji graphemes', () => {
      expect(measure('·')).to.eql(1);
      expect(measure('界')).to.eql(2);
      expect(measure('e\u0301')).to.eql(1);
      expect(measure('👨‍👩‍👧‍👦')).to.eql(2);
      expect(measure('🇳🇿')).to.eql(2);
      expect(measure('👍🏽')).to.eql(2);
      expect(measure('1️⃣')).to.eql(2);
    });
  });

  describe('padding', () => {
    it('pads to a visible target width without counting ANSI codes', () => {
      const input = c.cyan('cell');
      const padded = padEnd(input, 6);

      expect(Cli.stripAnsi(padded)).to.eql('cell  ');
    });

    it('pads by missing terminal cells rather than code units', () => {
      const padded = padEnd(c.cyan('界'), 4);

      expect(Cli.stripAnsi(padded)).to.eql('界  ');
      expect(measure(padded)).to.eql(4);
    });
  });

  describe('aggregate width', () => {
    it('returns the largest rendered terminal-cell width', () => {
      expect(max([c.cyan('cell'), c.gray('runtime')])).to.eql(7);
    });

    it('compares rendered terminal cells', () => {
      expect(max(['abc', '界界'])).to.eql(4);
    });
  });

  describe('fitted width', () => {
    it('starts from an explicit width, then caps by max width and subtracts reserve', () => {
      expect(fit({ width: 120, maxWidth: 100, reserve: 12 })).to.eql(88);
      expect(fit({ width: 72, reserve: 12 })).to.eql(60);
    });

    it('uses deterministic fallback width outside terminals', () => {
      expect(fit({ terminal: false, fallbackWidth: 90, reserve: 10 })).to.eql(80);
      expect(fit({ terminal: false, maxWidth: 70 })).to.eql(70);
      expect(fit({ terminal: false })).to.eql(80);
    });

    it('uses measured screen width when terminal output is available', () => {
      const restore = stubScreenWidth(132);

      try {
        expect(fit({ terminal: true, maxWidth: 100, reserve: 7 })).to.eql(93);
      } finally {
        restore();
      }
    });

    it('returns zero when the fitted width falls below the requested minimum', () => {
      expect(fit({ width: 20, reserve: 15, minWidth: 10 })).to.eql(0);
      expect(fit({ width: 30, reserve: 15, minWidth: 10 })).to.eql(15);
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
