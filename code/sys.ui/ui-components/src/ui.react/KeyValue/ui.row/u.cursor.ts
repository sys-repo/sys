import { type t } from '../common.ts';
import { type CellCursor } from '../ui/ui.Cell.tsx';

export type CursorPartRender = {
  readonly current?: t.KeyValue.Cursor.Part;
  readonly fill?: t.Color.Rgba;
};

export type CursorRender = {
  readonly part?: CursorPartRender;
};

export function toCellCursor(
  cursorPart: CursorPartRender | undefined,
  part: t.KeyValue.Cursor.Part,
): CellCursor | undefined {
  return cursorPart ? { current: cursorPart.current === part, fill: cursorPart.fill } : undefined;
}
