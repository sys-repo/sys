import React from 'react';
import { Keyboard, Rx, type t } from '../../common.ts';
import { setTarget } from '../m/m.Cursor.u.ts';
import { cursorRoot, focusCursorRoot, shouldLetKeyValueHandle } from './u.dom.ts';
import { eql, target as toTarget, toScope } from './u.resolve.ts';

/**
 * Hook: host-owned keyboard entry into a rendered KeyValue cursor root.
 *
 * Listens for host/global `Option+Enter` only while enabled. Focused-root
 * cursor grammar remains owned by `KeyValue.UI`.
 */
export function useEntry<T extends HTMLElement = HTMLDivElement>(
  args: t.KeyValue.Cursor.Keyboard.EntryArgs<T> = {},
): t.KeyValue.Cursor.Keyboard.EntryHook<T> {
  const fallbackRef = React.useRef<T>(null);
  const ref = args.ref ?? fallbackRef;
  const { cursor, enabled = true, items = [] } = args;

  React.useEffect(() => {
    if (!enabled) return;
    if (!cursor || cursor.enabled === false) return;
    if (cursor.entry === false) return;
    if (!cursor.onChange) return;

    const life = Rx.lifecycle();
    Keyboard.until(life.dispose$).on('ALT + Enter', (e) => {
      const root = cursorRoot(ref.current ?? undefined);
      if (!root) return;
      if (shouldLetKeyValueHandle(root)) return;

      const focused = focusCursorRoot(root);
      const entered = enterFirstCursorItem({ cursor, items });
      if (focused || entered) {
        e.preventDefault();
        e.stopKeyboardPropagation();
      }
    });

    return () => life.dispose();
  }, [cursor, enabled, items, ref]);

  return { ref };
}

/**
 * Helpers:
 */
function enterFirstCursorItem(args: {
  readonly cursor: t.KeyValue.Cursor.Props;
  readonly items: readonly t.KeyValue.Item[];
}) {
  const { cursor, items } = args;
  const model = cursor.model ?? {};
  if (model.current) return false;

  const target = toScope(items, []).items[0]?.target;
  if (!target) return false;

  const change = toEntryChange({ model, items, target });
  if (!change) return false;

  cursor.onChange?.(change);
  return true;
}

function toEntryChange(args: {
  readonly model: t.KeyValue.Cursor.Model;
  readonly items: readonly t.KeyValue.Item[];
  readonly target: t.KeyValue.Cursor.Target;
}): t.KeyValue.Cursor.EntryChange | undefined {
  const nextTarget = toTarget(args.target.path, args.target.part);
  const command: t.KeyValue.Cursor.Command<'cursor:set'> = {
    name: 'cursor:set',
    payload: { target: nextTarget },
  };
  const previous = args.model;
  const next = setTarget(previous, args.items, nextTarget);
  if (!eql(next.current, nextTarget)) return undefined;
  return {
    reason: 'cursor:entry',
    entry: 'option-enter',
    previous,
    next,
    target: nextTarget,
    command,
  };
}
