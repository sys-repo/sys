import { Files } from '../../m.files/mod.ts';
import { D, Is, type t } from '../common.ts';
import { fail } from './u.error.ts';
import { requiredVisiblePath, visiblePath } from './u.path.ts';

export type FsAuthorityKind = 'readonly' | 'live' | 'writable' | 'writable-live';

export type FsAuthorityOptions = {
  readonly policy?: t.Files.Policy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
  readonly maxWriteBytes?: t.NumberBytes;
};

type SupportMap = Record<FsAuthorityKind, Partial<t.Files.Capability.Map>>;

type FidelityMap = Record<FsAuthorityKind, t.Files.Fidelity | undefined>;

const SUPPORTS = Object.freeze(
  {
    readonly: Object.freeze({ list: true, stat: true, read: true, manifest: true }),
    live: Object.freeze({ list: true, stat: true, read: true, watch: true, manifest: true }),
    writable: Object.freeze({
      list: true,
      stat: true,
      read: true,
      write: true,
      remove: true,
      manifest: true,
    }),
    'writable-live': Object.freeze({
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
    readonly: undefined,
    live: 'live',
    writable: 'dynamic',
    'writable-live': 'live',
  } satisfies FidelityMap,
);

const ERROR_FACTORIES = Object.freeze(
  {
    invalid: invalidPath,
    unsupported(action) {
      return fail('FilesFsError.Unsupported', `${label(action)} unsupported`);
    },
    denied(action, path) {
      return fail('FilesFsError.PolicyDenied', `${label(action)} denied: ${path}`);
    },
  } satisfies t.Files.Authority.ErrorFactories,
);

/** Shared handler-gate options for files/fs backings. */
export const authorityHandlerOptions = (
  fs: t.FilesFs.Capability.Readonly,
): t.Files.Authority.HandlerOptions => {
  return Object.freeze({
    path: (args) => handlerPath(fs, args),
  });
};

/** Resolve files/fs authority for a concrete backing kind. */
export const resolveFsAuthority = (
  kind: FsAuthorityKind,
  options: FsAuthorityOptions = {},
): t.Files.Authority.Instance => {
  const fidelity = FIDELITY[kind];

  return Files.Authority.resolve({
    policy: options.policy,
    backing: {
      supports: SUPPORTS[kind],
      ...(fidelity === undefined ? {} : { fidelity }),
      maxReadBytes: options.maxReadBytes,
      maxWriteBytes: options.maxWriteBytes,
      encodings: D.encodings,
    },
    errors: ERROR_FACTORIES,
  });
};

function handlerPath<K extends t.Files.Cmd.Name>(
  fs: t.FilesFs.Capability.Readonly,
  args: t.Files.Authority.PathResolverArgs<K>,
): t.Files.String.Path | undefined {
  switch (args.name) {
    case 'files:capabilities':
      return undefined;
    case 'files:list':
    case 'files:watch':
    case 'files:manifest':
      return optionalPayloadPath(fs, args.payload);
    case 'files:stat':
    case 'files:read':
    case 'files:write':
    case 'files:remove':
      return requiredPayloadPath(fs, args.payload);
  }
}

function optionalPayloadPath(
  fs: t.FilesFs.Capability.Readonly,
  payload: unknown,
): t.Files.String.Path {
  if (!Is.plainObject(payload)) throw invalidPath('Files payload must be a plain object');
  return visiblePath(fs, payload.path as t.Files.String.Path | undefined);
}

function requiredPayloadPath(
  fs: t.FilesFs.Capability.Readonly,
  payload: unknown,
): t.Files.String.Path {
  if (!Is.plainObject(payload)) throw invalidPath('Files payload must be a plain object');
  return requiredVisiblePath(fs, payload.path as t.Files.String.Path | undefined);
}

function invalidPath(message: string): Error {
  return fail('FilesFsError.InvalidPath', message);
}

function label(action: t.Files.Authority.Action): string {
  return action[0].toUpperCase() + action.slice(1);
}
