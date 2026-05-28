import { Is, Num, type t } from '../common.ts';
import { allowed, manifestAllowed, type PolicyAction, snapshotPolicy } from '../u/u.policy.ts';

type CapabilitiesFromArgs = {
  readonly supports: t.Files.Capability.Map;
  readonly policy: t.Files.Policy.Shape;
  readonly fidelity?: t.Files.Fidelity;
  readonly maxReadBytes?: t.NumberBytes;
  readonly maxWriteBytes?: t.NumberBytes;
  readonly encodings?: readonly t.Files.Encoding[];
};

type AllowsArgs = {
  readonly action: t.Files.Authority.Action;
  readonly path: t.Files.String.Path;
  readonly supports: t.Files.Capability.Map;
  readonly policy: t.Files.Policy.Shape;
};

type AllowsArgsBase = {
  readonly supports: t.Files.Capability.Map;
  readonly policy: t.Files.Policy.Shape;
};

type GatedHandlersArgs = AllowsArgsBase & {
  readonly handlers: t.Files.Cmd.HandlerMap;
  readonly capabilities: t.Files.Capabilities;
  readonly unsupported: (action: t.Files.Authority.Action) => Error;
  readonly denied: (action: t.Files.Authority.Action, path: t.Files.String.Path) => Error;
  readonly options: t.Files.Authority.HandlerOptions;
};

/**
 * Resolve Files policy and backing facts into runtime authority.
 */
export const resolve: t.Files.Authority.Lib['resolve'] = (input) => {
  const errors = input.errors ?? {};
  const invalid = errors.invalid ?? invalidError;
  const unsupported = errors.unsupported ?? unsupportedError;
  const denied = errors.denied ?? deniedError;
  const policy = snapshotPolicy(input.policy, invalid);
  const supports = normalizeSupports(input.backing.supports);
  const maxReadBytes = effectiveByteLimit(
    'read',
    input.backing.maxReadBytes,
    policy.maxReadBytes,
    invalid,
  );
  const maxWriteBytes = effectiveByteLimit(
    'write',
    input.backing.maxWriteBytes,
    policy.maxWriteBytes,
    invalid,
  );
  const capabilities = capabilitiesFrom({
    supports,
    policy,
    fidelity: input.backing.fidelity,
    maxReadBytes,
    maxWriteBytes,
    encodings: input.backing.encodings,
  });

  return Object.freeze({
    policy,
    supports,
    capabilities,
    allows(action, path = '' as t.Files.String.Path) {
      return allows({ action, path, supports, policy });
    },
    check(action, path = '' as t.Files.String.Path) {
      if (!supports[action]) throw unsupported(action);
      if (!allows({ action, path, supports, policy })) throw denied(action, path);
    },
    handlers(handlers, options = {}) {
      return gatedHandlers({
        handlers,
        capabilities,
        supports,
        policy,
        unsupported,
        denied,
        options,
      });
    },
  });
};

/**
 * Helpers:
 */

function normalizeSupports(input: Partial<t.Files.Capability.Map>): t.Files.Capability.Map {
  return Object.freeze({
    list: input.list === true,
    stat: input.stat === true,
    read: input.read === true,
    write: input.write === true,
    remove: input.remove === true,
    watch: input.watch === true,
    manifest: input.manifest === true,
  });
}

function capabilitiesFrom(args: CapabilitiesFromArgs): t.Files.Capabilities {
  return Object.freeze({
    list: args.supports.list,
    stat: args.supports.stat,
    read: args.supports.read,
    write: args.supports.write,
    remove: args.supports.remove,
    watch: args.supports.watch,
    manifest: args.supports.manifest && args.policy.manifest === true,
    ...(args.fidelity === undefined ? {} : { fidelity: args.fidelity }),
    ...(args.supports.read && args.maxReadBytes !== undefined
      ? { maxReadBytes: args.maxReadBytes }
      : {}),
    ...(args.supports.write && args.maxWriteBytes !== undefined
      ? { maxWriteBytes: args.maxWriteBytes }
      : {}),
    ...(args.encodings === undefined ? {} : { encodings: Object.freeze([...args.encodings]) }),
  });
}

function effectiveByteLimit(
  label: 'read' | 'write',
  backing: t.NumberBytes | undefined,
  policy: t.NumberBytes | undefined,
  invalid: (message: string) => Error,
): t.NumberBytes | undefined {
  let max: t.NumberBytes | undefined;
  for (const value of [backing, policy]) {
    if (value === undefined) continue;
    if (!Num.Is.safeInt(value) || value < 0) {
      throw invalid(`Invalid Files ${label} byte limit`);
    }
    max = max === undefined || value < max ? value : max;
  }
  return max;
}

function allows(args: AllowsArgs): boolean {
  if (!args.supports[args.action]) return false;
  if (args.action === 'manifest') return manifestAllowed(args.policy, args.path);
  return allowed(args.policy, args.action satisfies PolicyAction, args.path);
}

function gatedHandlers(args: GatedHandlersArgs): t.Files.Cmd.HandlerMap {
  const gate = <K extends t.Files.Cmd.Name>(name: K) => {
    return ((
      payload: t.Files.Cmd.Payload[K],
      context: t.Cmd.Handler.Context<t.Files.Cmd.Name, t.Files.Cmd.Event, K>,
    ) => {
      const action = actionFor(name);
      if (action) {
        if (!args.supports[action]) throw args.unsupported(action);
        const path = handlerPath({ name, payload }, args.options);
        if (!allows({ action, path, supports: args.supports, policy: args.policy })) {
          throw args.denied(action, path);
        }
      }
      return args.handlers[name](payload as never, context as never);
    }) as t.Files.Cmd.HandlerMap[K];
  };

  const manifest = gate('files:manifest');

  return Object.freeze({
    'files:capabilities': () => args.capabilities,
    'files:list': gate('files:list'),
    'files:stat': gate('files:stat'),
    'files:read': gate('files:read'),
    'files:write': gate('files:write'),
    'files:remove': gate('files:remove'),
    'files:watch': gate('files:watch'),
    'files:manifest': (async (payload, context) => {
      const result = await manifest(payload, context);
      return { ...result, capabilities: args.capabilities };
    }) as t.Files.Cmd.HandlerMap['files:manifest'],
  });
}

function actionFor(name: t.Files.Cmd.Name): t.Files.Authority.Action | undefined {
  switch (name) {
    case 'files:capabilities':
      return undefined;
    case 'files:list':
      return 'list';
    case 'files:stat':
      return 'stat';
    case 'files:read':
      return 'read';
    case 'files:write':
      return 'write';
    case 'files:remove':
      return 'remove';
    case 'files:watch':
      return 'watch';
    case 'files:manifest':
      return 'manifest';
  }
}

function handlerPath<K extends t.Files.Cmd.Name>(
  args: t.Files.Authority.PathResolverArgs<K>,
  options: t.Files.Authority.HandlerOptions,
): t.Files.String.Path {
  const resolved = options.path?.(args);
  if (resolved !== undefined) return resolved;
  const payload = args.payload;
  if (Is.plainObject(payload) && Is.string(payload.path)) return payload.path;
  return '' as t.Files.String.Path;
}

function invalidError(message: string): Error {
  return namedError('FilesAuthorityError.InvalidPath', message);
}

function unsupportedError(action: t.Files.Authority.Action): Error {
  return namedError('FilesAuthorityError.Unsupported', `${label(action)} unsupported`);
}

function deniedError(action: t.Files.Authority.Action, path: t.Files.String.Path): Error {
  return namedError('FilesAuthorityError.PolicyDenied', `${label(action)} denied: ${path}`);
}

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function label(action: t.Files.Authority.Action): string {
  return action[0].toUpperCase() + action.slice(1);
}
