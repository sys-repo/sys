import { D, type t } from '../common.ts';
import { effectiveMaxReadBytes, readonlyCapabilities } from './u.capabilities.ts';
import { handlers } from './u.handlers.ts';
import { memoryIndex, type MemoryNodes } from './u.index.ts';
import { invalidPath } from './u.path.ts';
import { snapshotPolicy } from './u.policy.ts';
import { validatePageInput } from '../../m.files/u/u.page.ts';

type BaseRuntime = {
  readonly policy: t.FilesPolicy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly handlers: t.FilesCmd.HandlerMap;
  readonly nodes: MemoryNodes;
};

/** Build the shared readonly command base over mutable memory nodes. */
export const createBaseRuntime = (options: t.FilesMemory.Options = {}): BaseRuntime => {
  const nodes = memoryIndex(options);
  const policy = snapshotPolicy(options.policy);
  const maxReadBytes = effectiveMaxReadBytes(options.maxReadBytes, policy.maxReadBytes);
  const defaultLimit = options.defaultLimit ?? D.pageLimit;
  validatePageInput({ kind: 'list', defaultLimit }, invalidPath);
  const capabilities = readonlyCapabilities({ policy, maxReadBytes });
  const baseHandlers = handlers({ nodes, policy, capabilities, maxReadBytes, defaultLimit });

  return { policy, capabilities, handlers: baseHandlers, nodes };
};
