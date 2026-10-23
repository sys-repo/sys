import { c, Cli, Err, Is, Num, pkg } from '../common.ts';
import type { Start } from '../u.gui/t.ts';
import { fitTerminalRow, renderServiceRows } from './u.render.serviceRow.ts';

const FRAME_CURSOR_ROWS = 1;
const MAX_SCREEN_DIMENSION = 65_535;

/**
 * Project one admitted GUI state into its bounded terminal frame.
 */
export function renderScreen(input: Start.Gui.Presentation.RenderInput): string {
  const viewport = normalizeScreenSize(input.viewport);
  if (viewport.width === 0 || viewport.height === 0) return '';

  const flow = [
    ...Cli.Fmt.Header.rows({ pkg, width: viewport.width, tone: 'green' }),
    '',
    ...renderServiceRows(input, viewport.width),
  ];

  const capacity = Math.max(0, viewport.height - FRAME_CURSOR_ROWS);
  const footer = input.keyboard ? keyboardRows(viewport.width, allowsBack(input.state)) : [];
  const visible = Cli.Screen.Dock.bottom({ capacity, flow, footer });
  return visible.map((row) => fitTerminalRow(row, viewport.width)).join('\n').trimEnd();
}

/**
 * Admit one finite viewport snapshot for terminal rendering.
 */
export function normalizeScreenSize(input: unknown): Readonly<{ width: number; height: number }> {
  if (!Cli.Fmt.isReady() || !Is.plainObject(input)) {
    throw Err.std('start:gui screen presentation authority unavailable.');
  }
  const candidate = input;
  if (!isDimension(candidate.width) || !isDimension(candidate.height)) {
    throw Err.std('start:gui screen presentation failed.');
  }
  return Object.freeze({ width: candidate.width, height: candidate.height });
}

/**
 * Helpers:
 */
function keyboardRows(width: number, backEnabled: boolean): readonly string[] {
  const quit = Cli.Fmt.Keyboard.command({ label: 'quit', keys: ['q'] });
  const row = Cli.Fmt.Keyboard.row({
    width,
    candidates: backEnabled ? [{ left: Cli.Fmt.Keyboard.back(), right: quit }] : [{ right: quit }],
  });
  return row ? [c.gray(Cli.Fmt.hr({ width, weight: 'dashed' })), row] : [];
}

function allowsBack(state: Start.Gui.Presentation.State): boolean {
  return state.kind === 'preparing' || state.kind === 'starting-app-host' || state.kind === 'ready';
}

function isDimension(input: unknown): input is number {
  return Num.Is.int(input) && input >= 0 && input <= MAX_SCREEN_DIMENSION;
}
