import { c, Cli, pkg, StartGuiIntrinsic } from '../common.ts';

import { allowsBack } from '../../u/u.start.gui.settlement.ts';
import { normalizeSize, numericMax } from './u.input.ts';
import { fitTerminalRow, renderServiceRows } from './u.render.serviceRow.ts';
import type { StartGuiScreenRenderInput } from './t.ts';

const FRAME_CURSOR_ROWS = 1;

/** Project one admitted GUI state into its bounded terminal frame. */
export function renderScreen(input: StartGuiScreenRenderInput): string {
  const viewport = normalizeSize(input.viewport);
  if (viewport.width === 0 || viewport.height === 0) return '';

  const flow: string[] = [];
  StartGuiIntrinsic.arrayAppend(
    flow,
    Cli.Fmt.Header.rows({ pkg, width: viewport.width, tone: 'green' }),
  );
  StartGuiIntrinsic.arrayPush(flow, '');
  StartGuiIntrinsic.arrayAppend(flow, renderServiceRows(input, viewport.width));

  const capacity = numericMax(0, viewport.height - FRAME_CURSOR_ROWS);
  const footer = input.keyboard ? keyboardRows(viewport.width, allowsBack(input.state)) : [];
  const visible = Cli.Screen.Dock.bottom({ capacity, flow, footer });
  const fitted = StartGuiIntrinsic.arrayMap(visible, (row) => fitTerminalRow(row, viewport.width));
  return StartGuiIntrinsic.stringTrimEnd(StartGuiIntrinsic.arrayJoin(fitted, '\n'));
}

function keyboardRows(width: number, backEnabled: boolean): readonly string[] {
  const quit = Cli.Fmt.Keyboard.command({ label: 'quit', keys: ['q'] });
  const row = Cli.Fmt.Keyboard.row({
    width,
    candidates: backEnabled ? [{ left: Cli.Fmt.Keyboard.back(), right: quit }] : [{ right: quit }],
  });
  return row ? [c.gray(Cli.Fmt.hr({ width, weight: 'dashed' })), row] : [];
}
