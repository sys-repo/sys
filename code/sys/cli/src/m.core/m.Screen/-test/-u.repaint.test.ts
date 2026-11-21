import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { createRepaint } from '../u.repaint.ts';

const CSI = '\u001B[';
const SYNC_ON = `${CSI}?2026h`;
const SYNC_OFF = `${CSI}?2026l`;
const RESET = `${CSI}0m`;
// Supply real SGR bytes even when the test runner has color disabled.
const styled = `${CSI}32malpha${CSI}39m`;
const ERASE_LINE = `${CSI}2K`;
const ERASE_DOWN = `${CSI}0J`;
const cursor = (row: number) => `${CSI}${row};1H`;

describe('Cli.Screen.repaint', () => {
  it('writes a styled row and an explicit blank row in one synchronized TTY payload', () => {
    const { repaint, writes } = createHarness(true);
    repaint(`${styled}\n`);

    const expected = [
      `${SYNC_ON}${RESET}`,
      `${cursor(1)}${ERASE_LINE}${styled}${RESET}`,
      `${cursor(3)}${ERASE_DOWN}`,
      `${cursor(2)}${ERASE_LINE}${RESET}`,
      `${cursor(3)}${SYNC_OFF}`,
    ].join('');
    expectTypeOf(repaint).toEqualTypeOf<t.CliScreen.Lib['repaint']>();
    expect(writes).to.eql([expected]);
  });

  it('clears an empty frame from the home position', () => {
    const { repaint, writes } = createHarness(true);
    repaint('');
    expect(writes).to.eql([`${SYNC_ON}${RESET}${cursor(1)}${ERASE_DOWN}${SYNC_OFF}`]);
  });

  it('preserves the last painted row as a clamping viewport shrinks and grows', () => {
    const { repaint, writes } = createHarness(true);
    const paint = (frame: string, before: readonly string[]) => {
      repaint(frame);
      return visibleCells(writes.at(-1)!, before);
    };
    const full = paint('A\nB', ['       ', '       ']);
    expect(full).to.eql(['A      ', 'B      ']);

    const short = paint('summary', full.slice(0, 1));
    expect(short).to.eql(['summary']);

    const grown = paint('A stale\nB stale', [...short, '       ']);
    expect(grown).to.eql(['A stale', 'B stale']);
    expect(paint('x', grown)).to.eql(['x      ', '       ']);
  });

  it('writes plain frames with one sink newline outside a TTY', () => {
    const { repaint, writes } = createHarness(false);
    repaint(`${styled}\nbeta`);
    repaint('');
    expect(writes).to.eql(['alpha\nbeta\n', '\n']);
  });
});

/** Apply only the column-one cursor moves, erases and ASCII text used by the cell test. */
function visibleCells(payload: string, before: readonly string[]): string[] {
  const rows = [...before];
  const width = rows[0].length;
  const blank = ' '.repeat(width);
  let row = 0;
  let column = 0;
  const [prefix, ...chunks] = payload.split(CSI);
  expect(prefix).to.eql('');
  for (const chunk of chunks) {
    const match = /^([1-9]\d*;1H|2K|0J|0m|\?2026[hl])([ -~]*)$/.exec(chunk);
    if (!match) throw new Error(`Unsupported repaint fixture sequence: ${chunk}`);
    const [, command, text] = match;
    if (command.endsWith('H')) {
      row = Math.min(parseInt(command, 10), rows.length) - 1; // Clamp to the bottom margin.
      column = 0;
    } else if (command === '2K') {
      rows[row] = blank;
    } else if (command === '0J') {
      rows[row] = rows[row].slice(0, column) + blank.slice(column);
      rows.fill(blank, row + 1);
    }
    if (!text) continue;
    const end = column + text.length;
    expect(end).to.be.at.most(width);
    rows[row] = rows[row].slice(0, column) + text + rows[row].slice(end);
    column = end;
  }
  return rows;
}

function createHarness(isTerminal: boolean) {
  const writes: string[] = [];
  const repaint = createRepaint({
    isTerminal: () => isTerminal,
    write: (text) => writes.push(text),
  });
  return { repaint, writes };
}
