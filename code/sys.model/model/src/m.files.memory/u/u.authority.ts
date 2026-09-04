import { Files } from '../../m.files/mod.ts';
import { D, Is, type t } from '../common.ts';
import { fail } from './u.error.ts';
import { invalidPath, requiredVisiblePath, visiblePath } from './u.path.ts';

export type MemoryAuthorityKind = 'readonly' | 'writable' | 'live';

export type MemoryAuthorityOptions = {
  readonly policy?: t.Files.Policy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
  readonly maxWriteBytes?: t.NumberBytes;
};

type SupportMap = Record<MemoryAuthorityKind, Partial<t.Files.Capability.Map>>;

type FidelityMap = Record<MemoryAuthorityKind, t.Files.Fidelity>;

const SUPPORTS = Object.freeze(
  {
    readonly: Object.freeze({
      list: true,
      stat: true,
      read: true,
      manifest: true,
    }),
    writable: Object.freeze({
      list: true,
      stat: true,
      read: true,
      write: true,
      remove: true,
      manifest: true,
    }),
    live: Object.freeze({
      list: true,
      stat: true,
      read: true,
      write: true,
      remove: true,
      watch: true,
      manifest: true,
    }),
  } satisfies SupportMap,
);

const FIDELITY = Object.freeze(
  {
    readonly: 'snapshot',
    writable: 'dynamic',
    live: 'live',
  } satisfies FidelityMap,
);

const ERROR_FACTORIES = Object.freeze(
  {
    invalid: invalidPath,
    unsupported(action) {
      return fail('FilesMemoryError.Unsupported', `${label(action)} unsupported`);
    },
    denied(action, path) {
      return fail('FilesMemoryError.PolicyDenied', `${label(action)} denied: ${path}`);
    },
  } satisfies t.Files.Authority.ErrorFactories,
);

/** Shared handler-gate options for memory Files backings. */
export const authorityHandlerOptions = Object.freeze(
  {
    path: handlerPath,
  } satisfies t.Files.Authority.HandlerOptions,
);

/** Resolve memory Files authority for a concrete backing kind. */
export const resolveMemoryAuthority = (
  kind: MemoryAuthorityKind,
  options: MemoryAuthorityOptions = {},
): t.Files.Authority.Instance => {
  return Files.Authority.resolve({
    policy: options.policy,
    backing: {
      supports: SUPPORTS[kind],
      fidelity: FIDELITY[kind],
      maxReadBytes: options.maxReadBytes,
      maxWriteBytes: options.maxWriteBytes,
      encodings: D.encodings,
    },
    errors: ERROR_FACTORIES,
  });
};

function handlerPath<K extends t.Files.Cmd.Name>(
  args: t.Files.Authority.PathResolverArgs<K>,
): t.Files.String.Path | undefined {
  switch (args.name) {
    case 'files:capabilities':
      return undefined;
    case 'files:list':
    case 'files:watch':
    case 'files:manifest':
      return optionalPayloadPath(args.payload);
    case 'files:stat':
    case 'files:read':
    case 'files:write':
    case 'files:remove':
      return requiredPayloadPath(args.payload);
  }
}

function optionalPayloadPath(payload: unknown): t.Files.String.Path {
  if (!Is.plainObject(payload)) throw invalidPath('Files payload must be a plain object');
  return visiblePath(payload.path);
}

function requiredPayloadPath(payload: unknown): t.Files.String.Path {
  if (!Is.plainObject(payload)) throw invalidPath('Files payload must be a plain object');
  return requiredVisiblePath(payload.path);
}

function label(action: t.Files.Authority.Action): string {
  return action[0].toUpperCase() + action.slice(1);
}
