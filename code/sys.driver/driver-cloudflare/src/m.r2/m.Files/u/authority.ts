import { Files, Is, Str, type t } from '../common.ts';
import { ENCODINGS } from './metadata.ts';
import { requiredVisiblePath, visiblePath } from './path.ts';
import { fail, invalidPath } from './error.ts';

const SUPPORTS = Object.freeze(
  {
    list: true,
    stat: true,
    read: true,
    write: true,
    remove: true,
    watch: false,
    manifest: true,
  } satisfies Partial<t.Files.Capability.Map>,
);

const ERROR_FACTORIES = Object.freeze(
  {
    invalid: invalidPath,
    unsupported(action) {
      return fail('FilesR2Error.Unsupported', `${label(action)} unsupported`);
    },
    denied(action, path) {
      return fail('FilesR2Error.PolicyDenied', `${label(action)} denied: ${path}`);
    },
  } satisfies t.Files.Authority.ErrorFactories,
);

/** Shared handler-gate options for R2 Files backings. */
export const authorityHandlerOptions = Object.freeze(
  {
    path: handlerPath,
  } satisfies t.Files.Authority.HandlerOptions,
);

/** Resolve Files authority facts for the R2 backing. */
export function resolveAuthority(options: {
  readonly policy?: t.Files.Policy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
  readonly maxWriteBytes?: t.NumberBytes;
}): t.Files.Authority.Instance {
  return Files.Authority.resolve({
    policy: options.policy,
    backing: {
      supports: SUPPORTS,
      fidelity: 'dynamic',
      maxReadBytes: options.maxReadBytes,
      maxWriteBytes: options.maxWriteBytes,
      encodings: ENCODINGS,
    },
    errors: ERROR_FACTORIES,
  });
}

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
  return Str.capitalize(action);
}
