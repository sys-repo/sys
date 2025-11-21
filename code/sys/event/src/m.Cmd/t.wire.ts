/**
 * Discriminant for command wire messages.
 */
export type CmdKind = 'cmd' | 'cmd:result';

/**
 * Command name identifier.
 * Typically a dotted or slash-delimited string, e.g. 'worker/ping'.
 */
export type CmdName = string;

/**
 * Wire envelope sent from client → host.
 */
export type CmdEnvelope = {
  readonly kind: 'cmd';
  readonly id: string;
  readonly name: CmdName;
  readonly payload?: unknown;
};

/**
 * Wire envelope sent from host → client.
 */
export type CmdResultEnvelope = {
  readonly kind: 'cmd:result';
  readonly id: string;
  readonly name: CmdName;
  readonly payload?: unknown;
  readonly error?: string;
};
