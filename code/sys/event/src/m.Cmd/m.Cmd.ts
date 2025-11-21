import { type t } from './common.ts';
import { make } from './u.make.ts';
import { CmdIs as Is } from './m.Is.ts';

/**
 * Small, transport-agnostic command bus providing typed
 * request/response over any MessagePort-like endpoint.
 */
export const Cmd: t.CmdLib = {
  Is,
  make,
};
