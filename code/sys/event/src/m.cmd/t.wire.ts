import type { t } from './common.ts';

/**
 * Discriminant for command wire messages.
 */
export type CmdKind = 'cmd' | 'cmd:event' | 'cmd:result';

/**
 * Command indentifying name.
 * Typically a dotted or slash-delimited string, e.g. 'worker/ping'.
 */
export type CmdName = string;

/**
 * Optional routing domain for command messages.
 *
 * Used to disambiguate multiple logical command sets sharing
 * the same `MessagePort` or transport. If present, both client
 * and host must match it exactly for a message to be accepted.
 */
export type CmdNamespace = string;

/** Unique identifier for a client → host command request. */
export type CmdReqId = `req-${string}`;

/**
 * Union of all command wire envelopes.
 */
export type CmdWireEnvelope = CmdEnvelope | CmdEventEnvelope | CmdResultEnvelope;

/**
 * Wire envelope sent from client → host.
 */
export type CmdEnvelope = {
  readonly kind: 'cmd';
  readonly id: t.CmdReqId;
  readonly ns?: t.CmdNamespace;
  readonly name: CmdName;
  readonly payload?: unknown;
};

/**
 * Wire envelope sent from host → client for streamed events.
 */
export type CmdEventEnvelope = {
  readonly kind: 'cmd:event';
  readonly id: t.CmdReqId;
  readonly name: CmdName;
  readonly ns?: t.CmdNamespace;
  readonly payload?: unknown;
};

/**
 * Wire envelope sent from host → client.
 */
export type CmdResultEnvelope = {
  readonly kind: 'cmd:result';
  readonly id: t.CmdReqId;
  readonly name: CmdName;
  readonly ns?: t.CmdNamespace;
  readonly payload?: unknown;
  readonly error?: string;
};
