import { type t } from '../../common.ts';
import { DataAttr } from './u.render.ts';

export type CursorFill = {
  readonly current: t.Color.Rgba;
  readonly part: t.Color.Rgba;
};

/** True when the actual KeyValue cursor root, not a descendant, owns DOM focus. */
export function isCursorRootFocused(root: HTMLElement | null | undefined) {
  if (typeof document === 'undefined' || !root) return false;
  return document.activeElement === root;
}

/** Apply visual cursor affordance fills to the currently rendered cursor targets. */
export function applyCursorFill(root: HTMLElement, fill: CursorFill) {
  root.querySelectorAll<HTMLElement>(`[${DataAttr.current}="true"]`).forEach((el) => {
    el.style.backgroundColor = fill.current;
  });
  root.querySelectorAll<HTMLElement>(`[${DataAttr.cellCurrent}="true"]`).forEach((el) => {
    el.style.backgroundColor = fill.part;
  });
}
