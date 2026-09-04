import { Files } from '../../m.files/mod.ts';
import { D, Is, type t } from '../common.ts';
import { fail, invalidPath } from './u.error.ts';
import { requiredVisiblePath, visiblePath } from './u.path.ts';

type SupportMap = Record<'readonly', Partial<t.Files.Capability.Map>>;

const SUPPORTS = Object.freeze(
  {
    readonly: Object.freeze({
      list: true,
      stat: true,
      read: true,
      manifest: true,
    }),
  } satisfies SupportMap,
);

const ERROR_FACTORIES = Object.freeze(
  {
    invalid: invalidPath,
    unsupported(action) {
      return fail(
        'FilesStaticError.Unsupported',
        `Static dist backing does not support ${action}`,
      );
    },
    denied(action, path) {
      return fail('FilesStaticError.PolicyDenied', `${label(action)} denied: ${path}`);
    },
  } satisfies t.Files.Authority.ErrorFactories,
);

/** Shared handler-gate options for static Files backings. */
export const authorityHandlerOptions = Object.freeze(
  {
    path: handlerPath,
  } satisfies t.Files.Authority.HandlerOptions,
);

/** Resolve static Files authority. */
export const resolveStaticAuthority = (
  options: { readonly policy?: t.Files.Policy.Shape } = {},
): t.Files.Authority.Instance => {
  return Files.Authority.resolve({
    policy: options.policy,
    backing: {
      supports: SUPPORTS.readonly,
      fidelity: D.fidelity,
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
  return visiblePath(payload.path as t.Files.String.Path | undefined);
}

function requiredPayloadPath(payload: unknown): t.Files.String.Path {
  if (!Is.plainObject(payload)) throw invalidPath('Files payload must be a plain object');
  return requiredVisiblePath(payload.path as t.Files.String.Path | undefined);
}

function label(action: t.Files.Authority.Action): string {
  return action[0].toUpperCase() + action.slice(1);
}
