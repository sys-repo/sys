import { type t } from './common.ts';

/**
 * Discriminant for command wire messages.
 */
export type CmdKind = 'cmd' | 'cmd:result';

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
 * Wire envelope sent from client → host.
 */
export type CmdEnvelope = {
  readonly kind: 'cmd';
  readonly ns?: t.CmdNamespace;
  readonly id: t.CmdReqId;
  readonly name: CmdName;
  readonly payload?: unknown;
};

/**
 * Wire envelope sent from host → client.
 */
export type CmdResultEnvelope = {
  readonly kind: 'cmd:result';
  readonly ns?: t.CmdNamespace;
  readonly id: string;
  readonly name: CmdName;
  readonly payload?: unknown;
  readonly error?: string;
};
