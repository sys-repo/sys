import { Process, stripAnsi, type t } from '../common.ts';

type Deps = {
  isTerminal(): boolean;
  write(text: string): void;
};

const CSI = '\u001B[';
const SYNC_ON = `${CSI}?2026h`;
const SYNC_OFF = `${CSI}?2026l`;
const RESET = `${CSI}0m`;
const ERASE_LINE = `${CSI}2K`;
const ERASE_DOWN = `${CSI}0J`;

/** Create a full-viewport repaint operation over injected stdout effects. */
export function createRepaint(deps: Deps): t.CliScreen.Lib['repaint'] {
  return (frame) => {
    const payload = deps.isTerminal() ? ttyPayload(frame) : `${stripAnsi(frame)}\n`;
    deps.write(payload);
  };
}

/** Repaint the stdout terminal without publishing an intermediate full-screen clear. */
export const repaint = createRepaint({
  isTerminal: () => Process.stdout.isTerminal(),
  write: (text) => Process.stdout.write(text),
});

/**
 * Helpers:
 */
function ttyPayload(frame: string) {
  const rows = frame ? frame.split('\n') : [];
  const content = rows.map((row, index) => {
    return `${cursor(index + 1)}${ERASE_LINE}${row}${RESET}`;
  }).join('');
  return `${SYNC_ON}${RESET}${content}${cursor(rows.length + 1)}${ERASE_DOWN}${SYNC_OFF}`;
}

function cursor(row: number) {
  return `${CSI}${row};1H`;
}
