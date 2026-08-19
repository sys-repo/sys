import { c, describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';
import { MAX_TERMINAL_CELLS, MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS } from '../../u/u.layout.ts';
import {
  appendTerminalCellMeasurement,
  startTerminalCellMeasurement,
} from '../u.width/u.measure.ts';
import { fit, fitWithScreen, max, measure, padEnd } from '../u.width/u.width.ts';
import * as UnicodeWidth from '../u.width/u.unicode.ts';

describe('Cli.Fmt.Text.Width', () => {
  describe('measurement', () => {
    it('measures rendered text after ANSI codes are stripped', () => {
      expect(measure(c.cyan('cell'))).to.eql(4);
      expect(measure(c.cyan('界'))).to.eql(2);
      expect(measure('\u001B]8;;https://example.com\u0007界\u001B]8;;\u0007')).to.eql(2);
      expect(measure('\u001B]0;hidden words\u001B\\cell')).to.eql(4);
      expect(measure('\u001B]0;hidden words\u009Ccell')).to.eql(4);
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

    it('retains frozen trailing-grapheme evidence for incremental layout', () => {
      const prepend = '\u001B[31m\u0D4E\u001B[0m';
      const initial = startTerminalCellMeasurement(prepend);
      const appended = appendTerminalCellMeasurement(initial, ' a');

      expect(Object.isFrozen(initial)).to.eql(true);
      expect(Object.isFrozen(appended)).to.eql(true);
      expect(initial.width).to.eql(measure(prepend));
      expect(appended.width).to.eql(measure(`${prepend} a`));
      expect(appended.finalizedWidth).to.eql(1);
      expect(appended.trailingCluster).to.eql('a');

      const exact = startTerminalCellMeasurement(`${'界'.repeat(32_767)}a`);
      const overflow = appendTerminalCellMeasurement(exact, ' a');
      expect(exact.width).to.eql(MAX_TERMINAL_CELLS);
      expect(overflow.width).to.eql(MAX_TERMINAL_CELLS + 1);
      expect(Object.isFrozen(overflow)).to.eql(true);
    });

    it('owns zero-width, fullwidth, halfwidth, and Hangul measurement semantics', () => {
      expect(measure('\u0000\u200B')).to.eql(0);
      expect(measure('\u3000')).to.eql(2);
      expect(measure('！')).to.eql(2);
      expect(measure('ｱ')).to.eql(1);
      expect(measure('가')).to.eql(2);
      expect(measure('ᄀ가')).to.eql(4);
      expect(Object.keys(UnicodeWidth)).to.eql(['eastAsianCellWidth']);
      expect(Object.isFrozen(UnicodeWidth.eastAsianCellWidth)).to.eql(true);
    });

    it('scans maximum malformed OSC source without treating it as a control sequence', () => {
      const input = `${'\u001B]'.repeat((MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - 1) / 2)}x`;

      expect(input.length).to.eql(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS);
      expect(measure(input)).to.eql((MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS + 1) / 2);
    });

    it('publishes the exact cell ceiling and refuses every maximum-plus-one form', () => {
      const wideExact = `${'界'.repeat((MAX_TERMINAL_CELLS - 1) / 2)}a`;
      const wideOverflow = '界'.repeat((MAX_TERMINAL_CELLS + 1) / 2);
      const ansiExact = `\u001B[31m${wideExact}\u001B[0m`;
      const ansiOverflow = `\u001B[31m${wideOverflow}\u001B[0m`;
      const zeroExact = `${
        '\u200B'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - wideExact.length)
      }${wideExact}`;
      const zeroOverflow = `${
        '\u200B'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - wideOverflow.length)
      }${wideOverflow}`;

      expect(measure('a'.repeat(MAX_TERMINAL_CELLS))).to.eql(MAX_TERMINAL_CELLS);
      expect(measure(wideExact)).to.eql(MAX_TERMINAL_CELLS);
      expect(measure(ansiExact)).to.eql(MAX_TERMINAL_CELLS);
      expect(measure(zeroExact)).to.eql(MAX_TERMINAL_CELLS);

      const failures = [
        failureOf(() => measure('a'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS + 1))),
        failureOf(() => measure(wideOverflow)),
        failureOf(() => measure(ansiOverflow)),
        failureOf(() => measure(zeroOverflow)),
        failureOf(() => max([wideOverflow])),
      ];
      for (let index = 0; index < failures.length; index += 1) {
        expect((failures[index] as Error).message).to.eql(
          'Cli.Fmt.Text finite presentation limit exceeded.',
        );
        expect(failures[index]).to.equal(failures[0]);
      }
      expect(Object.isFrozen(failures[0])).to.eql(true);
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

    it('bounds allocation targets to the aggregate terminal-text output', () => {
      expect(padEnd('', MAX_TERMINAL_CELLS).length).to.eql(MAX_TERMINAL_CELLS);
      expect(() => padEnd('\u200B', MAX_TERMINAL_CELLS)).to.throw(
        'Cli.Fmt.Text finite presentation limit exceeded.',
      );
      expect(padEnd('x', MAX_TERMINAL_CELLS + 1)).to.eql('x');
      expect(padEnd('x', Number.MAX_VALUE)).to.eql('x');
    });
  });

  describe('aggregate width', () => {
    it('returns the largest rendered terminal-cell width', () => {
      expect(max([c.cyan('cell'), c.gray('runtime')])).to.eql(7);
    });

    it('compares rendered terminal cells', () => {
      expect(max(['abc', '界界'])).to.eql(4);
    });

    it('bounds cumulative collection text before measuring admitted entries', () => {
      const exact = 'a'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS);
      expect(max([exact])).to.eql(MAX_TERMINAL_CELLS);
      expect(() => max([exact, 'a'])).to.throw(
        'Cli.Fmt.Text finite presentation limit exceeded.',
      );
    });

    it('refuses an over-ceiling Help pair width before repeat allocation', () => {
      const over = '界'.repeat((MAX_TERMINAL_CELLS + 1) / 2);

      expect(() =>
        Fmt.Help.build({
          tool: '@sys/tool',
          sections: [{ kind: 'pairs', label: 'Options', items: [[over, 'description']] }],
        })
      ).to.throw('Cli.Fmt.Text finite presentation limit exceeded.');
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
      const screenSize = () => ({ width: 132, height: 24 });
      expect(fitWithScreen(screenSize, { terminal: true, maxWidth: 100, reserve: 7 })).to.eql(93);
    });

    it('returns zero when the fitted width falls below the requested minimum', () => {
      expect(fit({ width: 20, reserve: 15, minWidth: 10 })).to.eql(0);
      expect(fit({ width: 30, reserve: 15, minWidth: 10 })).to.eql(15);
    });

    it('admits the exact layout maximum and rejects larger explicit or measured widths', () => {
      const oversizedScreen = () => ({ width: MAX_TERMINAL_CELLS + 1, height: 24 });

      expect(fit({ width: MAX_TERMINAL_CELLS, terminal: false })).to.eql(MAX_TERMINAL_CELLS);
      expect(fit({ width: MAX_TERMINAL_CELLS + 1, terminal: false })).to.eql(80);
      expect(fit({ width: Number.MAX_VALUE, terminal: false })).to.eql(80);
      expect(fitWithScreen(oversizedScreen, { terminal: true })).to.eql(80);
      expect(padEnd('x', fit({ width: Number.MAX_VALUE, terminal: false })).length).to.eql(80);
    });
  });
});

function failureOf(operation: () => unknown): unknown {
  try {
    operation();
  } catch (cause) {
    return cause;
  }
}
