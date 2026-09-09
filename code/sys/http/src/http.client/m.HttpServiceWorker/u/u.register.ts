import { Is, type t } from '../../common.ts';
import { admit } from './u.admit.ts';
import { snapshotHref } from './u.input.ts';

type RegistrationContainer = Pick<ServiceWorkerContainer, 'controller' | 'register'>;
type ResolvedContainer = {
  readonly container: RegistrationContainer;
  readonly register: RegistrationContainer['register'];
};

const INVALID_OPTIONS = Symbol('invalid-registration-options');

/** Register a worker only after admitting the actual browser location. */
export const register: t.HttpServiceWorker.Register.Method = async (args) => {
  let admission: t.HttpServiceWorker.Admission.Result;
  try {
    admission = admit(globalThis.location);
  } catch {
    return Object.freeze({ kind: 'failed', reason: 'invalid-url' });
  }
  if (admission.kind !== 'admitted') return admission;

  let scriptUrl: string | undefined;
  try {
    scriptUrl = snapshotScriptUrl(args?.scriptUrl);
  } catch {
    return Object.freeze({ kind: 'failed', reason: 'invalid-script-url', admission });
  }
  if (!scriptUrl) {
    return Object.freeze({ kind: 'failed', reason: 'invalid-script-url', admission });
  }

  let options: RegistrationOptions | undefined;
  try {
    options = snapshotOptions(args.options);
  } catch {
    return Object.freeze({
      kind: 'failed',
      reason: 'invalid-registration-options',
      admission,
    });
  }

  let serviceWorker: ResolvedContainer | undefined;
  try {
    serviceWorker = resolveContainer();
  } catch {
    return Object.freeze({
      kind: 'failed',
      reason: 'registration-substrate-failure',
      admission,
    });
  }
  if (!serviceWorker) {
    return Object.freeze({
      kind: 'unsupported',
      reason: 'service-worker-unavailable',
      admission,
    });
  }

  let registration: ServiceWorkerRegistration;
  try {
    registration = await serviceWorker.register(scriptUrl, options);
  } catch {
    return Object.freeze({ kind: 'failed', reason: 'registration-rejected', admission });
  }

  let scope: unknown;
  try {
    scope = registration.scope;
  } catch {
    return Object.freeze({ kind: 'failed', reason: 'registration-unverified', admission });
  }
  if (!Is.string(scope)) {
    return Object.freeze({ kind: 'failed', reason: 'registration-unverified', admission });
  }

  return Object.freeze({
    kind: 'registered',
    admission,
    scope,
    controller: observeController(serviceWorker.container),
  });
};

function resolveContainer(): ResolvedContainer | undefined {
  const navigator = globalThis.navigator as
    | (Navigator & { readonly serviceWorker?: RegistrationContainer })
    | undefined;
  return snapshotContainer(navigator?.serviceWorker);
}

function snapshotContainer(input: unknown): ResolvedContainer | undefined {
  if (!Is.object(input)) return undefined;

  const container = input as RegistrationContainer;
  const register = container.register;
  if (!Is.func(register)) return undefined;
  return { container, register: register.bind(container) };
}

function snapshotScriptUrl(input: string | t.UrlLike | undefined): string | undefined {
  const snapshot = snapshotHref(input);
  return snapshot.kind === 'href' && snapshot.href ? snapshot.href : undefined;
}

function snapshotOptions(input: unknown): RegistrationOptions | undefined {
  if (input === undefined) return undefined;
  if (!Is.record(input)) throw INVALID_OPTIONS;

  const source = input as t.HttpServiceWorker.Register.Options;
  const scope = source.scope;
  const type = source.type;
  const updateViaCache = source.updateViaCache;
  if (scope !== undefined && !Is.string(scope)) throw INVALID_OPTIONS;
  if (type !== undefined && !(type === 'classic' || type === 'module')) throw INVALID_OPTIONS;
  if (
    updateViaCache !== undefined &&
    !(updateViaCache === 'all' || updateViaCache === 'imports' || updateViaCache === 'none')
  ) {
    throw INVALID_OPTIONS;
  }

  const output: RegistrationOptions = {};
  if (scope !== undefined) output.scope = scope;
  if (type !== undefined) output.type = type;
  if (updateViaCache !== undefined) output.updateViaCache = updateViaCache;
  return Object.freeze(output);
}

function observeController(
  serviceWorker: RegistrationContainer,
): t.HttpServiceWorker.Register.Registered['controller'] {
  try {
    return Is.nil(serviceWorker.controller) ? 'absent' : 'present';
  } catch {
    return 'unknown';
  }
}
