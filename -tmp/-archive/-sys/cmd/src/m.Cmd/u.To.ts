import { DEFAULTS, type t } from './common.ts';
import { Is } from './u.Is.ts';

/**
 * Retrieve the hidden "transport" (immutable document) from a command.
 */
export function toTransport(cmd: any) {
  return toValue<t.CmdTransport>(cmd, DEFAULTS.symbol.transport);
}

/**
 * Retrieve the hidden "paths" field from a command.
 */
export function toPaths(cmd: any) {
  return toValue<t.CmdPaths>(cmd, DEFAULTS.symbol.paths);
}

/**
 * Retrieve the hidden "issuer" field from a command.
 */
export function toIssuer(cmd: any) {
  return toValue<string | undefined>(cmd, DEFAULTS.symbol.issuer);
}

/**
 * Helpers
 */
function toValue<T>(cmd: any, key: symbol) {
  if (!Is.cmd(cmd)) throw new Error('Input not a <Cmd>');
  return (cmd as any)[key] as T;
}
