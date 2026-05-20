import { Is, Num, type t } from './common.ts';
import { allowed, manifestAllowed, type PolicyAction, snapshotPolicy } from './u/u.policy.ts';

type CapabilitiesFromArgs = {
  readonly supports: t.FilesCapability.Map;
  readonly policy: t.FilesPolicy.Shape;
  readonly fidelity?: t.Files.Fidelity;
  readonly maxReadBytes?: t.NumberBytes;
  readonly encodings?: readonly t.Files.Encoding[];
};

type AllowsArgs = {
  readonly action: t.FilesAuthority.Action;
  readonly path: t.Files.String.Path;
  readonly supports: t.FilesCapability.Map;
  readonly policy: t.FilesPolicy.Shape;
};

type AllowsArgsBase = {
  readonly supports: t.FilesCapability.Map;
  readonly policy: t.FilesPolicy.Shape;
};

type GatedHandlersArgs = AllowsArgsBase & {
  readonly handlers: t.FilesCmd.HandlerMap;
  readonly capabilities: t.Files.Capabilities;
  readonly unsupported: (action: t.FilesAuthority.Action) => Error;
  readonly denied: (action: t.FilesAuthority.Action, path: t.Files.String.Path) => Error;
  readonly options: t.FilesAuthority.HandlerOptions;
};

/** Resolve Files policy and backing facts into runtime authority. */
export const resolve: t.FilesAuthority.Lib['resolve'] = (input) => {
  const errors = input.errors ?? {};
  const invalid = errors.invalid ?? invalidError;
  const unsupported = errors.unsupported ?? unsupportedError;
  const denied = errors.denied ?? deniedError;
  const policy = snapshotPolicy(input.policy, invalid);
  const supports = normalizeSupports(input.backing.supports);
  const maxReadBytes = effectiveMaxReadBytes(
    input.backing.maxReadBytes,
    policy.maxReadBytes,
    invalid,
  );
  const capabilities = capabilitiesFrom({
    supports,
    policy,
    fidelity: input.backing.fidelity,
    maxReadBytes,
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

function normalizeSupports(input: Partial<t.FilesCapability.Map>): t.FilesCapability.Map {
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
    ...(args.maxReadBytes === undefined ? {} : { maxReadBytes: args.maxReadBytes }),
    ...(args.encodings === undefined ? {} : { encodings: Object.freeze([...args.encodings]) }),
  });
}

function effectiveMaxReadBytes(
  backing: t.NumberBytes | undefined,
  policy: t.NumberBytes | undefined,
  invalid: (message: string) => Error,
): t.NumberBytes | undefined {
  let max: t.NumberBytes | undefined;
  for (const value of [backing, policy]) {
    if (value === undefined) continue;
    if (!Num.Is.safeInt(value) || value < 0) {
      throw invalid('Invalid Files read byte limit');
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

function gatedHandlers(args: GatedHandlersArgs): t.FilesCmd.HandlerMap {
  const gate = <K extends t.FilesCmd.Name>(name: K) => {
    return ((
      payload: t.FilesCmd.Payload[K],
      context: t.Cmd.Handler.Context<t.FilesCmd.Name, t.FilesCmd.Event, K>,
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
    }) as t.FilesCmd.HandlerMap[K];
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
    }) as t.FilesCmd.HandlerMap['files:manifest'],
  });
}

function actionFor(name: t.FilesCmd.Name): t.FilesAuthority.Action | undefined {
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

function handlerPath<K extends t.FilesCmd.Name>(
  args: t.FilesAuthority.PathResolverArgs<K>,
  options: t.FilesAuthority.HandlerOptions,
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

function unsupportedError(action: t.FilesAuthority.Action): Error {
  return namedError('FilesAuthorityError.Unsupported', `${label(action)} unsupported`);
}

function deniedError(action: t.FilesAuthority.Action, path: t.Files.String.Path): Error {
  return namedError('FilesAuthorityError.PolicyDenied', `${label(action)} denied: ${path}`);
}

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function label(action: t.FilesAuthority.Action): string {
  return action[0].toUpperCase() + action.slice(1);
}
