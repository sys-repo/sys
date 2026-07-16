import { Signal, type t } from './common.ts';
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
  const keyboardEntry = KeyValue.Cursor.useKeyboardEntry({
    enabled: v.cursor,
    items: v.items ?? [],
    cursor: {
      model: v.cursorModel,
      onChange: (e) => p.cursorModel.value = e.next,
    },
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
