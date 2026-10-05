import { D, type t } from '../common.ts';
import {
  authorityHandlerOptions,
  type FsAuthorityKind,
  resolveFsAuthority,
} from './u.authority.ts';
import { handlers } from './u.handlers.ts';
import { validatePageInput } from './u.page.ts';
import { type Scope, scope } from './u.path.ts';

type BaseRuntimeOptions<Fs extends t.FilesFs.Capability.Readonly> =
  & Omit<t.FilesFs.ReadonlyOptions, 'fs'>
  & { readonly fs: Fs; readonly maxWriteBytes?: t.NumberBytes };

export type FsRuntimeSource<Fs extends t.FilesFs.Capability.Readonly> = {
  readonly scope: Scope<Fs>;
  readonly defaultLimit: t.Files.Limit;
};

export type FsRuntimeCore<Fs extends t.FilesFs.Capability.Readonly> = FsRuntimeSource<Fs> & {
  readonly authority: t.Files.Authority.Instance;
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly baseHandlers: t.Files.Cmd.HandlerMap;
};

type BaseRuntime<Fs extends t.FilesFs.Capability.Readonly> = FsRuntimeSource<Fs> & {
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly handlers: t.Files.Cmd.HandlerMap;
};

/** Build shared files/fs source state for concrete runtime variants. */
const createRuntimeSource = <Fs extends t.FilesFs.Capability.Readonly>(
  options: BaseRuntimeOptions<Fs>,
): FsRuntimeSource<Fs> => {
  const defaultLimit = options.defaultLimit ?? D.pageLimit;
  validatePageInput({ kind: 'list', defaultLimit });
  return { scope: scope(options.fs, options.root), defaultLimit };
};

/** Resolve authority and raw base handlers for a concrete files/fs runtime kind. */
export const createRuntimeCore = <Fs extends t.FilesFs.Capability.Readonly>(
  kind: FsAuthorityKind,
  options: BaseRuntimeOptions<Fs>,
): FsRuntimeCore<Fs> => {
  const source = createRuntimeSource(options);
  const authority = resolveFsAuthority(kind, {
    policy: options.policy,
    maxReadBytes: options.maxReadBytes,
    maxWriteBytes: options.maxWriteBytes,
  });
  const policy = authority.policy;
  const capabilities = authority.capabilities;

  return {
    ...source,
    authority,
    policy,
    capabilities,
    baseHandlers: handlers({
      scope: source.scope,
      policy,
      capabilities,
      maxReadBytes: capabilities.maxReadBytes,
      defaultLimit: source.defaultLimit,
    }),
  };
};

/** Build the readonly command base over a bounded filesystem scope. */
export const createBaseRuntime = <Fs extends t.FilesFs.Capability.Readonly>(
  options: BaseRuntimeOptions<Fs>,
): BaseRuntime<Fs> => {
  const core = createRuntimeCore('readonly', options);

  return {
    scope: core.scope,
    defaultLimit: core.defaultLimit,
    policy: core.policy,
    capabilities: core.capabilities,
    handlers: core.authority.handlers(core.baseHandlers, authorityHandlerOptions(core.scope.fs)),
  };
};
