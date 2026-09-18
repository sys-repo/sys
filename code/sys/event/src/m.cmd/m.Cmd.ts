import type { t } from './common.ts';
import { make } from './u.make.ts';
import { CmdIs as Is } from './m.Is.ts';
import { Transport } from './transport/mod.ts';

/**
 * Small, transport-agnostic command bus providing typed
 * request/response and streaming events over any MessagePort-like endpoint.
 */
export const Cmd: t.Cmd.Lib = Object.freeze({
  Is,
  make,
  Transport,
});
