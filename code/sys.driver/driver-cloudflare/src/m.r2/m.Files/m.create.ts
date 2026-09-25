import type { t } from './common.ts';
import { list } from './u.cmd/list.ts';
import { manifest } from './u.cmd/manifest.ts';
import { read } from './u.cmd/read.ts';
import { remove } from './u.cmd/remove.ts';
import { stat } from './u.cmd/stat.ts';
import { write } from './u.cmd/write.ts';
import { authorityHandlerOptions, resolveAuthority } from './u/authority.ts';
import { fail } from './u/error.ts';
import { enumerationBudget, enumerationLimits } from './u/enumeration.ts';
import { DEFAULT_LIMIT, validatePageInput } from './u/page.ts';
import { toPrefix } from './u/path.ts';
import type { Runtime } from './u/runtime.ts';

/** Create a bounded writable Files backing over an R2 bucket. */
export function create(options: t.R2.Files.CreateOptions): t.R2.Files.Writable {
  const limits = enumerationLimits(options.enumeration);
  const prefix = toPrefix(options.prefix);
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  validatePageInput({ kind: 'list', defaultLimit });

  const authority = resolveAuthority({
    policy: options.policy,
    maxReadBytes: options.maxReadBytes,
    maxWriteBytes: options.maxWriteBytes,
  });
  const runtime: Omit<Runtime, 'enumeration'> = Object.freeze({
    bucket: options.bucket,
    prefix,
    authority,
    policy: authority.policy,
    capabilities: authority.capabilities,
    defaultLimit,
  });

  const operation = (): Runtime => ({ ...runtime, enumeration: enumerationBudget(limits) });
  const handlers: t.Files.Cmd.HandlerMap = Object.freeze({
    'files:capabilities': () => runtime.capabilities,
    'files:list': (payload) => list(operation(), payload),
    'files:stat': (payload) => stat(operation(), payload),
    'files:read': (payload) => read(operation(), payload),
    'files:write': (payload) => write(operation(), payload),
    'files:remove': async (payload) => (await remove(operation(), payload)).result,
    'files:manifest': (payload) => manifest(operation(), payload),
    'files:watch'() {
      throw fail('FilesR2Error.Unsupported', 'Watch unsupported');
    },
  });

  return Object.freeze({
    kind: 'files/r2:writable',
    policy: authority.policy,
    capabilities: authority.capabilities,
    handlers: authority.handlers(handlers, authorityHandlerOptions),
  });
}
