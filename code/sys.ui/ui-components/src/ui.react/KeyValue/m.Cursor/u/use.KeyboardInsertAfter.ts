import React from 'react';
import { Keyboard, Rx, type t } from '../../common.ts';
import { activeElementWithin, cursorRoot, isInteractiveElement } from './u.dom.ts';
import { insertAfter } from './u.insert.ts';

/**
 * Hook: host-owned keyboard insertion after the current KeyValue cursor target.
 *
 * Listens for host/global `Option+Enter` only while a rendered cursor root is focused
 * and a current cursor target exists. Hosts own the item factory and item-state mutation.
 */
export function useInsertAfter<T extends HTMLElement = HTMLDivElement>(
  args: t.KeyValue.Cursor.Keyboard.InsertAfterArgs<T> = {},
): t.KeyValue.Cursor.Keyboard.InsertAfterHook<T> {
  const fallbackRef = React.useRef<T>(null);
  const ref = args.ref ?? fallbackRef;
  const { cursor, enabled = true, items = [], createItem, onChange } = args;
  const itemsRef = React.useRef<readonly t.KeyValue.Item[]>(items);
  const itemsPropRef = React.useRef<readonly t.KeyValue.Item[]>(items);
  if (itemsPropRef.current !== items) {
    itemsPropRef.current = items;
    itemsRef.current = items;
  }

  React.useEffect(() => {
    if (!enabled) return;
    if (!cursor || cursor.enabled === false) return;
    if (!cursor.model?.current) return;
    if (!createItem) return;
    if (!onChange) return;

    const life = Rx.lifecycle();
    Keyboard.until(life.dispose$).on('ALT + Enter', (event) => {
      const root = cursorRoot(ref.current ?? undefined);
      if (!root) return;

      const active = activeElementWithin(root);
      if (!active) return;
      if (isInteractiveElement(active, root)) return;
      if (!isOptionEnter(event.event.keypress)) return;

      const change = insertAfter({
        items: itemsRef.current,
        current: cursor.model?.current,
        createItem,
      });
      if (!change) return;

      itemsRef.current = change.next;
      event.preventDefault();
      event.stopKeyboardPropagation();
      onChange(change);
    });

    return () => life.dispose();
  }, [createItem, cursor, enabled, itemsRef, onChange, ref]);

  return { ref };
}

function isOptionEnter(input: t.Keyboard.Keypress.Props): boolean {
  if (input.key !== 'Enter') return false;
  const modifiers = Keyboard.modifiers(input);
  if (!modifiers.alt) return false;
  if (modifiers.shift) return false;
  if (Keyboard.Is.command(modifiers)) return false;
  if (modifiers.ctrl || modifiers.meta) return false;
  return true;
}
