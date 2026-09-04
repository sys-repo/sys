import { Is, Signal, type t } from './common.ts';
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
  const keyboardEntry = KeyValue.Cursor.Keyboard.useEntry({
    enabled: v.cursor,
    items: v.items ?? [],
    cursor: {
      model: v.cursorModel,
      onChange: (e) => p.cursorModel.value = e.next,
    },
  });
  KeyValue.Cursor.Keyboard.useInsertAfter({
    enabled: v.cursor,
    ref: keyboardEntry.ref,
    items: v.items,
    cursor: { enabled: v.cursor, model: v.cursorModel },
    createItem: ({ items, siblings, index, after }) => {
      if (isHr(after) || isHr(siblings[index])) return undefined;
      return {
        id: nextHrId(items),
        kind: 'hr',
      };
    },
    onChange: (e) => p.items.value = e.next,
  });

  return (
    <div ref={keyboardEntry.ref} style={{ display: 'contents' }}>
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
        cursor={toCursorProps(debug, v.cursor, v.cursorModel, v.cursorArrival)}
      />
    </div>
  );
}

/**
 * Helpers:
 */
function isHr(item: t.KeyValue.Item | undefined): boolean {
  return item?.kind === 'hr';
}

function nextHrId(items: readonly t.KeyValue.Item[]) {
  const existing = new Set(flatIds(items));

  let index = 1;
  while (existing.has(`inserted:hr:${index}`)) index += 1;
  return `inserted:hr:${index}`;
}

function flatIds(items: readonly t.KeyValue.Item[]): string[] {
  return items.flatMap((item) => {
    const id = Is.string(item.id) && !Is.blank(item.id) ? [item.id] : [];
    return item.kind === 'group' ? [...id, ...flatIds(item.items)] : id;
  });
}

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
  arrival: t.KeyValue.Cursor.Arrival,
): t.KeyValue.Cursor.Props | undefined {
  if (!enabled) return;
  return {
    arrival,
    model,
    onChange: (e) => debug.props.cursorModel.value = e.next,
  };
}
