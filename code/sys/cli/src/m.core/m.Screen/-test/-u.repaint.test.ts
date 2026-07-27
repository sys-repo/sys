import { c, describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { createRepaint } from '../u.repaint.ts';

const CSI = '\u001B[';
const SYNC_ON = `${CSI}?2026h`;
const SYNC_OFF = `${CSI}?2026l`;
const RESET = `${CSI}0m`;
const ERASE_LINE = `${CSI}2K`;
const ERASE_DOWN = `${CSI}0J`;
const cursor = (row: number) => `${CSI}${row};1H`;

describe('Cli.Screen.repaint', () => {
  it('commits one addressed TTY payload without publishing a full-screen clear', () => {
    const harness = createHarness(true);
    const styled = c.green('beta');

    harness.repaint(`alpha\n${styled}`);

    const expected = [
      SYNC_ON,
      RESET,
      cursor(1),
      ERASE_LINE,
      'alpha',
      RESET,
      cursor(2),
      ERASE_LINE,
      styled,
      RESET,
      cursor(3),
      ERASE_DOWN,
      SYNC_OFF,
    ].join('');
    expectTypeOf(harness.repaint).toEqualTypeOf<t.CliScreen.Lib['repaint']>();
    expect(harness.writes).to.eql([expected]);
    expect(expected).to.not.include(`${CSI}2J`);
    expect(expected).to.not.include(`${CSI}3J`);
  });

  it('preserves explicit empty rows and clears an empty frame deterministically', () => {
    const harness = createHarness(true);

    harness.repaint('one\n');
    harness.repaint('');

    expect(harness.writes[0]).to.eql([
      SYNC_ON,
      RESET,
      cursor(1),
      ERASE_LINE,
      'one',
      RESET,
      cursor(2),
      ERASE_LINE,
      RESET,
      cursor(3),
      ERASE_DOWN,
      SYNC_OFF,
    ].join(''));
    expect(harness.writes[1]).to.eql([
      SYNC_ON,
      RESET,
      cursor(1),
      ERASE_DOWN,
      SYNC_OFF,
    ].join(''));
  });

  it('erases row tails and stale rows when the replacement is shorter', () => {
    const harness = createHarness(true);

    harness.repaint('a much longer row\nstale row');
    harness.repaint('x');

    expect(harness.writes[1]).to.eql([
      SYNC_ON,
      RESET,
      cursor(1),
      ERASE_LINE,
      'x',
      RESET,
      cursor(2),
      ERASE_DOWN,
      SYNC_OFF,
    ].join(''));
  });

  it('writes plain frames with one sink newline outside a TTY', () => {
    const harness = createHarness(false);
    const frame = `alpha\n${c.green('beta')}`;

    harness.repaint(frame);
    harness.repaint('');

    expect(harness.writes).to.eql(['alpha\nbeta\n', '\n']);
    expect(harness.writes.every((item) => !item.includes(CSI))).to.eql(true);
  });
});

/**
 * Helpers:
 */
function createHarness(isTerminal: boolean) {
  const writes: string[] = [];
  const repaint = createRepaint({
    isTerminal: () => isTerminal,
    write: (text) => writes.push(text),
  });
  return { repaint, writes };
}
