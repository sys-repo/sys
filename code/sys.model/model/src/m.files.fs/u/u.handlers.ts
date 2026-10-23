import { type t } from '../common.ts';
import { list } from '../u.cmd/u.cmd.list.ts';
import { manifest } from '../u.cmd/u.cmd.manifest.ts';
import { read } from '../u.cmd/u.cmd.read.ts';
import { stat } from '../u.cmd/u.cmd.stat.ts';
import { fail } from './u.error.ts';
import type { Scope } from './u.path.ts';

type HandlerArgs = {
  readonly scope: Scope;
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly maxReadBytes?: t.NumberBytes;
  readonly defaultLimit: t.Files.Limit;
};

/**
 * Build the Files Cmd handler map for a readonly files/fs backing.
 *
 * Command-local policy checks intentionally remain below the authority gate for
 * descendant filtering, real-path containment, and result filtering.
 */
export const handlers = (args: HandlerArgs): t.Files.Cmd.HandlerMap => {
  return Object.freeze({
    'files:capabilities': () => args.capabilities,
    'files:list': async (payload) => list(args.scope, args.policy, payload, args.defaultLimit),
    'files:stat': async (payload) => stat(args.scope, args.policy, payload),
    'files:read': async (payload) => read(args.scope, args.policy, payload, args.maxReadBytes),
    'files:write': () => {
      throw fail('FilesFsError.Unsupported', 'Readonly files/fs backing does not support write');
    },
    'files:remove': () => {
      throw fail('FilesFsError.Unsupported', 'Readonly files/fs backing does not support remove');
    },
    'files:watch': () => {
      throw fail('FilesFsError.Unsupported', 'Readonly files/fs backing does not support watch');
    },
    'files:manifest': async (payload) => {
      return manifest(args.scope, args.policy, payload, args.capabilities, args.defaultLimit);
    },
  });
};
