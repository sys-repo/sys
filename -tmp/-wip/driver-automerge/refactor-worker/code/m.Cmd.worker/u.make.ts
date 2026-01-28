import { type t, Cmd } from './common.ts';

/**
 * Factory for worker-level command instances.
 */
export function make(): t.WorkerCmdFactory {
  return Cmd.make<t.WorkerCmdName, t.WorkerCmdPayload, t.WorkerCmdResult>();
}
