import { type t, Time } from './common.ts';
import { emit } from './u.emit.ts';

/**
 * Emit a `editor:ping` event.
 */
export const ping: t.EditorBusLib['ping'] = (bus$, request, nonce, editorId) => {
  const e = { kind: 'editor:ping', request, nonce, editorId } satisfies t.EventEditorPing;
  emit(bus$, 'micro', e);
  return e;
};

/**
 * Emit a `editor:pong` event.
 */
export const pong: t.EditorBusLib['pong'] = (bus$, nonce, states) => {
  const at = Time.now.timestamp;
  const e = { kind: 'editor:pong', at, states, nonce } satisfies t.EventEditorPong;
  emit(bus$, 'micro', e);
  return e;
};
