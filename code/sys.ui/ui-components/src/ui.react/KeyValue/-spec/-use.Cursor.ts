import { type RefObject, useEffect } from 'react';
import { Keyboard, Rx, type t } from './common.ts';
import { KeyValue } from '../mod.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

/**
 * Harness hook: host-level keyboard handoff into the KeyValue cursor root.
 *
 * This intentionally stays in the spec harness. KeyValue owns focused-root
 * cursor grammar; the host owns global command/focus arbitration.
 */
export function useCursorKeyboardHandoff(args: {
  readonly debug: DebugSignals;
  readonly enabled: boolean;
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly items: readonly t.KeyValue.Item[];
}) {
  const { debug, enabled, hostRef, items } = args;

  useEffect(() => {
    if (!enabled) return;

    const life = Rx.lifecycle();
    Keyboard.until(life.dispose$).on('ALT + Enter', (e) => {
      const root = cursorRoot(hostRef.current ?? undefined);
      if (!root) return;
      if (shouldLetKeyValueHandle(root)) return;

      const focused = focusCursorRoot(root);
      const entered = enterFirstCursorItem(debug, items);
      if (focused || entered) e.stopKeyboardPropagation();
    });

    return () => life.dispose();
  }, [debug, enabled, hostRef, items]);
}

/**
 * Helpers:
 */
function cursorRoot(host?: HTMLElement) {
  return host?.querySelector<HTMLElement>('[data-keyvalue-cursor-root]');
}

function focusCursorRoot(root: HTMLElement) {
  root.focus({ preventScroll: true });
  return globalThis.document?.activeElement === root;
}

function shouldLetKeyValueHandle(root: HTMLElement) {
  const active = globalThis.document?.activeElement;
  if (!active) return false;
  if (active === root || root.contains(active)) return true;
  if (active === globalThis.document?.body) return false;
  return !!active.closest(ACTIVE_ELEMENT_SKIP_SELECTOR);
}

function enterFirstCursorItem(debug: DebugSignals, items: readonly t.KeyValue.Item[]) {
  const model = debug.props.cursorModel.value;
  if (model.current) return false;

  const target = KeyValue.Cursor.scope(items).items[0]?.target;
  const command: t.KeyValue.Cursor.Command<'cursor:set'> = {
    name: 'cursor:set',
    payload: { target },
  };
  const next = KeyValue.Cursor.apply(model, items, command);
  if (!KeyValue.Cursor.eql(next.current, target)) return false;

  debug.props.cursorModel.value = next;
  return true;
}

const ACTIVE_ELEMENT_SKIP_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
].join(',');
