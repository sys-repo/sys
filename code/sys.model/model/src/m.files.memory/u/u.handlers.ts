import { type t } from '../common.ts';
import { list } from '../u.cmd/u.cmd.list.ts';
import { manifest } from '../u.cmd/u.cmd.manifest.ts';
import { read } from '../u.cmd/u.cmd.read.ts';
import { stat } from '../u.cmd/u.cmd.stat.ts';
import { fail, translate } from './u.error.ts';
import { type MemoryNodes } from './u.index.ts';

type HandlerArgs = {
  readonly nodes: MemoryNodes;
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly maxReadBytes?: t.NumberBytes;
  readonly defaultLimit: t.Files.Limit;
};

/**
 * Build command handlers over memory nodes.
 *
 * Command-local policy checks intentionally remain below the authority gate for
 * descendant filtering, result filtering, and mutation atomicity.
 */
export const handlers = (args: HandlerArgs): t.Files.Cmd.HandlerMap => {
  return Object.freeze({
    'files:capabilities'() {
      return args.capabilities;
    },

    'files:list'(payload) {
      return attempt(() => list(args.nodes, args.policy, payload, args.defaultLimit));
    },

    'files:stat'(payload) {
      return attempt(() => stat(args.nodes, args.policy, payload));
    },

    'files:read'(payload) {
      return attempt(() => read(args.nodes, args.policy, payload, args.maxReadBytes));
    },

    'files:write'() {
      throw fail(
        'FilesMemoryError.Unsupported',
        'Readonly memory Files backing does not support write',
      );
    },

    'files:remove'() {
      throw fail(
        'FilesMemoryError.Unsupported',
        'Readonly memory Files backing does not support remove',
      );
    },

    'files:watch'() {
      throw fail('FilesMemoryError.Unsupported', 'Memory Files backing does not support watch');
    },

    'files:manifest'(payload) {
      return attempt(() => {
        return manifest(args.nodes, args.policy, payload, args.capabilities, args.defaultLimit);
      });
    },
  });
};

async function attempt<T>(fn: () => t.Awaitable<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw translate(error);
  }
}
