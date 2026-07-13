import { type RefObject, useEffect, useRef } from 'react';
import { Keyboard, Rx, Signal, type t } from './common.ts';
import { KeyValue } from '../mod.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type Props = {
  debug: DebugSignals;
};

/**
 * Spec host: adapts debug signals into KeyValue's controlled props.
 */
export function Root(props: Props) {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  const rootRef = useRef<HTMLDivElement>(null);

  useCursorFocusKeyboard({ debug, enabled: v.cursor, hostRef: rootRef, items: v.items ?? [] });

  return (
    <div ref={rootRef} style={{ display: 'contents' }}>
      <KeyValue.UI
        debug={v.debug}
        theme={v.theme}
        size={v.size}
        mono={v.mono}
        truncate={v.truncate}
        enabled={v.enabled}
        layout={debug.layout}
        items={v.items}
        reorder={toReorderProps(debug, v.reorder)}
        animation={v.animation ? true : undefined}
        cursor={toCursorProps(debug, v.cursor, v.cursorModel)}
      />
    </div>
  );
}

/**
 * Helpers:
 */
function useCursorFocusKeyboard(args: {
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

      root.focus({ preventScroll: true });
      enterFirstCursorItem(debug, items);
      e.stopKeyboardPropagation();
    });

    return () => life.dispose();
  }, [debug, enabled, hostRef, items]);
}

function cursorRoot(host?: HTMLElement) {
  return host?.querySelector<HTMLElement>('[data-keyvalue-cursor-root]');
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
  if (model.current) return;

  const target = KeyValue.Cursor.scope(items).items[0]?.target;
  const command: t.KeyValue.Cursor.Command<'cursor:set'> = {
    name: 'cursor:set',
    payload: { target },
  };
  const next = KeyValue.Cursor.apply(model, items, command);
  if (!KeyValue.Cursor.eql(next.current, target)) return;

  debug.props.cursorModel.value = next;
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

function toReorderProps(debug: DebugSignals, enabled: boolean): t.KeyValue.Reorder | undefined {
  if (!enabled) return;
  return {
    onStart: (e) => console.info('⚡️ KeyValue.reorder.onStart:', e),
    onEnd: (e) => console.info('⚡️ KeyValue.reorder.onEnd:', e),
    onChange(e) {
      console.info('⚡️ KeyValue.reorder.onChange:', e);
      debug.props.items.value = e.next;
    },
  };
}

function toCursorProps(
  debug: DebugSignals,
  enabled: boolean,
  model: t.KeyValue.Cursor.Model,
): t.KeyValue.Cursor.Props | undefined {
  if (!enabled) return;
  return {
    model,
    onChange: (e) => debug.props.cursorModel.value = e.next,
  };
}
