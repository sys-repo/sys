import { type t } from '../common.ts';
import { list } from '../u.cmd/u.cmd.list.ts';
import { manifest } from '../u.cmd/u.cmd.manifest.ts';
import { read } from '../u.cmd/u.cmd.read.ts';
import { stat } from '../u.cmd/u.cmd.stat.ts';
import { fail } from './u.error.ts';
import type { StaticIndex } from './u.index.ts';

export type HandlerArgs = {
  readonly index: StaticIndex;
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly defaultLimit: t.Files.Limit;
};

/**
 * Build the Files Cmd handler map for a static dist backing.
 *
 * Command-local policy checks intentionally remain below the authority gate for
 * descendant filtering, content-ref filtering, and precise static index errors.
 */
export const handlers = (args: HandlerArgs): t.Files.Cmd.HandlerMap => {
  return Object.freeze({
    'files:capabilities': () => args.capabilities,
    'files:list': (payload) => list(args.index, args.policy, payload, args.defaultLimit),
    'files:stat': (payload) => stat(args.index, args.policy, payload),
    'files:read': (payload) => read(args.index, args.policy, payload),
    'files:write': () => {
      throw fail('FilesStaticError.Unsupported', 'Static dist backing does not support write');
    },
    'files:remove': () => {
      throw fail('FilesStaticError.Unsupported', 'Static dist backing does not support remove');
    },
    'files:watch': () => {
      throw fail('FilesStaticError.Unsupported', 'Static dist backing does not support watch');
    },
    'files:manifest': (payload) => {
      return manifest(args.index, args.policy, payload, args.capabilities, args.defaultLimit);
    },
  });
};
