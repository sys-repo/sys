import React from 'react';
import { Color, Obj, type t } from '../../common.ts';
import { Cursor } from '../mod.ts';

export type CursorArrivalKind = 'first-adoption' | 'target-change';
export type CursorArrivalCue = {
  readonly key: string;
  readonly kind: CursorArrivalKind;
  readonly fill: t.Color.Rgba;
};

type CursorArrival = {
  readonly key: string;
  readonly kind: CursorArrivalKind;
};
type CursorArrivalState = {
  adopted: boolean;
  previousKey?: string;
};

export function useCursorArrivalCue(args: {
  readonly items: readonly t.KeyValue.Item[];
  readonly cursor?: t.KeyValue.Cursor.Props;
  readonly fg: string;
}): CursorArrivalCue | undefined {
  const state = React.useRef<CursorArrivalState>({ adopted: false });
  const currentKey = toCursorCurrentKey(args.items, args.cursor);
  const mode = toCursorArrivalMode(args.cursor);
  const cue = toCursorArrival(mode, currentKey, state.current);

  React.useEffect(() => {
    if (!currentKey) return;
    state.current.adopted = true;
    state.current.previousKey = currentKey;
  }, [currentKey]);

  return cue ? { ...cue, fill: toCursorArrivalFill(args.fg, cue.kind) } : undefined;
}

/**
 * Helpers:
 */
function toCursorArrivalMode(
  cursor?: t.KeyValue.Cursor.Props,
): t.KeyValue.Cursor.Arrival {
  if (!cursor || cursor.enabled === false) return false;
  if (cursor.arrival === false || cursor.arrival === 'flash') return cursor.arrival;
  return 'flash';
}

function toCursorArrival(
  mode: t.KeyValue.Cursor.Arrival,
  currentKey: string | undefined,
  state: CursorArrivalState,
): CursorArrival | undefined {
  if (!currentKey || mode === false) return undefined;
  if (mode !== 'flash') return undefined;

  const firstAdoption = !state.adopted;
  const targetChange = state.adopted && state.previousKey !== undefined &&
    state.previousKey !== currentKey;
  if (firstAdoption) return { key: currentKey, kind: 'first-adoption' };
  if (targetChange) return { key: currentKey, kind: 'target-change' };
  return undefined;
}

function toCursorArrivalFill(fg: string, kind: CursorArrivalKind) {
  return Color.alpha(fg, kind === 'target-change' ? 0.07 : 0.24);
}

function toCursorCurrentKey(
  items: readonly t.KeyValue.Item[],
  cursor?: t.KeyValue.Cursor.Props,
): string | undefined {
  if (!cursor || cursor.enabled === false) return undefined;
  const current = cursor.model?.current;
  if (!current) return undefined;
  const resolved = Cursor.set({}, items, current).current;
  if (!resolved) return undefined;
  return `${Obj.Path.encode(resolved.path)}:${resolved.part ?? 'atom'}`;
}
