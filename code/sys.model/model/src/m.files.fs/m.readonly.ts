import { D, type t } from './common.ts';
import { effectiveMaxReadBytes, readonlyCapabilities } from './u.capabilities.ts';
import { handlers } from './u.handlers.ts';
import { validatePageInput } from './u.page.ts';
import { scope } from './u.path.ts';
import { snapshotPolicy } from './u.policy.ts';

/**
 * Create a bounded readonly Files backing from a structural filesystem capability.
 */
export const createReadonly: t.FilesFs.Lib['readonly'] = (options) => {
  const policy = snapshotPolicy(options.policy);
  const maxReadBytes = effectiveMaxReadBytes(options.maxReadBytes, policy.maxReadBytes);
  const defaultLimit = options.defaultLimit ?? D.pageLimit;
  validatePageInput({ kind: 'list', defaultLimit });
  const fsScope = scope(options.fs, options.root);
  const capabilities = readonlyCapabilities({ policy, maxReadBytes });

  return {
    kind: 'files/fs:readonly',
    policy,
    capabilities,
    handlers: handlers({ scope: fsScope, policy, capabilities, maxReadBytes, defaultLimit }),
  };
};
