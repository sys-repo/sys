import { type t } from './common.ts';
import { list } from './u.cmd/list.ts';
import { manifest } from './u.cmd/manifest.ts';
import { read } from './u.cmd/read.ts';
import { remove } from './u.cmd/remove.ts';
import { stat } from './u.cmd/stat.ts';
import { write } from './u.cmd/write.ts';
import { authorityHandlerOptions, resolveAuthority } from './u/authority.ts';
import { fail } from './u/error.ts';
import { DEFAULT_LIMIT, validatePageInput } from './u/page.ts';
import { toPrefix } from './u/path.ts';
import { type Runtime } from './u/runtime.ts';

/** Create a bounded writable Files backing over an R2 bucket. */
export function create(options: t.R2.Files.CreateOptions): t.R2.Files.Writable {
  const prefix = toPrefix(options.prefix);
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  validatePageInput({ kind: 'list', defaultLimit });

  const authority = resolveAuthority({
    policy: options.policy,
    maxReadBytes: options.maxReadBytes,
    maxWriteBytes: options.maxWriteBytes,
  });
  const runtime: Runtime = Object.freeze({
    bucket: options.bucket,
    prefix,
    authority,
    policy: authority.policy,
    capabilities: authority.capabilities,
    defaultLimit,
  });

  const handlers: t.Files.Cmd.HandlerMap = Object.freeze({
    'files:capabilities': () => runtime.capabilities,
    'files:list': (payload) => list(runtime, payload),
    'files:stat': (payload) => stat(runtime, payload),
    'files:read': (payload) => read(runtime, payload),
    'files:write': (payload) => write(runtime, payload),
    'files:remove': async (payload) => (await remove(runtime, payload)).result,
    'files:watch': () => {
      throw fail('FilesR2Error.Unsupported', 'Watch unsupported');
    },
    'files:manifest': (payload) => manifest(runtime, payload),
  });

  return Object.freeze({
    kind: 'files/r2:writable',
    policy: authority.policy,
    capabilities: authority.capabilities,
    handlers: authority.handlers(handlers, authorityHandlerOptions),
  });
}
