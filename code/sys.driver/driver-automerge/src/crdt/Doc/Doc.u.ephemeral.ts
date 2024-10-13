import type { t } from './common.ts';
import { toHandle } from './u.Handle.ts';

/**
 * Generates a strongly typed "ephemeral event" emitter
 * for the given document.
 */
export function broadcaster<T extends t.CBOR>(doc: t.Doc) {
  const handle = toHandle(doc);
  return (message: T) => handle.broadcast(message);
}

/**
 * Broadcasts an ephemeral event for the given document.
 */
export function broadcast<T extends t.CBOR>(doc: t.Doc, message: T) {
  toHandle(doc).broadcast(message);
}

/**
 * Export
 */
export const ephemeral = {
  broadcast,
  broadcaster,
} as const;
