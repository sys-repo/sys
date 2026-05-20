import { D, type t } from '../common.ts';
import { effectiveMaxReadBytes, readonlyCapabilities } from './u.capabilities.ts';
import { handlers } from './u.handlers.ts';
import { validatePageInput } from './u.page.ts';
import { type Scope, scope } from './u.path.ts';
import { snapshotPolicy } from './u.policy.ts';

type BaseRuntimeOptions<Fs extends t.FilesFs.Capability.Readonly> =
  & Omit<t.FilesFs.ReadonlyOptions, 'fs'>
  & { readonly fs: Fs };

type BaseRuntime<Fs extends t.FilesFs.Capability.Readonly> = {
  readonly policy: t.FilesPolicy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly handlers: t.FilesCmd.HandlerMap;
  readonly scope: Scope<Fs>;
};

/** Build the shared readonly command base over a bounded filesystem scope. */
export const createBaseRuntime = <Fs extends t.FilesFs.Capability.Readonly>(
  options: BaseRuntimeOptions<Fs>,
): BaseRuntime<Fs> => {
  const policy = snapshotPolicy(options.policy);
  const maxReadBytes = effectiveMaxReadBytes(options.maxReadBytes, policy.maxReadBytes);
  const defaultLimit = options.defaultLimit ?? D.pageLimit;
  validatePageInput({ kind: 'list', defaultLimit });
  const fsScope = scope(options.fs, options.root);
  const capabilities = readonlyCapabilities({ policy, maxReadBytes });
  const baseHandlers = handlers({
    scope: fsScope,
    policy,
    capabilities,
    maxReadBytes,
    defaultLimit,
  });

  return { policy, capabilities, handlers: baseHandlers, scope: fsScope };
};
