import { validatePageInput } from '../../m.files/u/u.page.ts';
import { D, type t } from '../common.ts';
import {
  authorityHandlerOptions,
  type MemoryAuthorityKind,
  resolveMemoryAuthority,
} from './u.authority.ts';
import { handlers } from './u.handlers.ts';
import { memoryIndex, type MemoryNodes } from './u.index.ts';
import { invalidPath } from './u.path.ts';

export type MemoryRuntimeSource = {
  readonly nodes: MemoryNodes;
  readonly defaultLimit: t.Files.Limit;
};

export type MemoryRuntimeCore = MemoryRuntimeSource & {
  readonly authority: t.Files.Authority.Instance;
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly baseHandlers: t.Files.Cmd.HandlerMap;
};

type BaseRuntime = MemoryRuntimeSource & {
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly handlers: t.Files.Cmd.HandlerMap;
};

/** Build shared memory source state for concrete runtime variants. */
const createRuntimeSource = (
  options: t.FilesMemory.Options = {},
): MemoryRuntimeSource => {
  const nodes = memoryIndex(options);
  const defaultLimit = options.defaultLimit ?? D.pageLimit;
  validatePageInput({ kind: 'list', defaultLimit }, invalidPath);
  return { nodes, defaultLimit };
};

/** Resolve authority and raw base handlers for a concrete memory runtime kind. */
export const createRuntimeCore = (
  kind: MemoryAuthorityKind,
  options: t.FilesMemory.Options = {},
): MemoryRuntimeCore => {
  const source = createRuntimeSource(options);
  const authority = resolveMemoryAuthority(kind, {
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
      nodes: source.nodes,
      policy,
      capabilities,
      maxReadBytes: capabilities.maxReadBytes,
      defaultLimit: source.defaultLimit,
    }),
  };
};

/** Build the readonly command base over mutable memory nodes. */
export const createBaseRuntime = (options: t.FilesMemory.Options = {}): BaseRuntime => {
  const core = createRuntimeCore('readonly', options);

  return {
    nodes: core.nodes,
    defaultLimit: core.defaultLimit,
    policy: core.policy,
    capabilities: core.capabilities,
    handlers: core.authority.handlers(core.baseHandlers, authorityHandlerOptions),
  };
};
