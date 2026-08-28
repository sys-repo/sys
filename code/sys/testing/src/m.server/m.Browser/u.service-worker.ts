import { Err, Is, Json, Num, Str, type t, Time } from './common.ts';
import { assertChromeExecutableInput } from './u.chrome.executable.ts';
import {
  attachChromeTarget,
  enableChromeTarget,
  evaluateChromeTarget,
  guardChromeTargetOrigin,
  navigateChromeTarget,
  reloadChromeTarget,
} from './u.chrome.protocol.ts';
import { openChromeSession } from './u.chrome.session.ts';

const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_SETTLE = 100;
const DEFAULT_POLL_INTERVAL = 100;
const DEFAULT_MAX_DIAGNOSTICS = 50;
const DEFAULT_MAX_DIAGNOSTIC_LENGTH = 500;
const HARD_MAX_TIMEOUT = 60_000;
const HARD_MAX_SETTLE = 5_000;
const HARD_MAX_POLL_INTERVAL = 5_000;
const HARD_MAX_STEPS = 100;
const HARD_MAX_DIAGNOSTICS = 200;
const HARD_MAX_DIAGNOSTIC_LENGTH = 2_000;
const HARD_MAX_INPUT_LENGTH = 4_096;
const HARD_MAX_SNAPSHOT_STRING_LENGTH = 4_096;
const HARD_MAX_RESULT_BYTES = 512_000;
const MAX_REGISTRATIONS = 100;
const MAX_CACHE_NAMES = 200;

const SNAPSHOT_EXPRESSION = String.raw`(async () => {
  const serviceWorkerApi = 'serviceWorker' in navigator;
  const cacheStorageApi = 'caches' in globalThis;
  const registrations = serviceWorkerApi ? await navigator.serviceWorker.getRegistrations() : [];
  const cacheNames = cacheStorageApi ? await caches.keys() : [];
  const clip = (value) => {
    const text = String(value);
    return text.length > __MAX_STRING_LENGTH__ ? text.slice(0, __MAX_STRING_LENGTH__) : text;
  };
  let stringsTruncated = false;
  const bounded = (value) => {
    const text = String(value);
    if (text.length > __MAX_STRING_LENGTH__) stringsTruncated = true;
    return clip(text);
  };
  const boundedWorker = (value) => value
    ? ({ scriptURL: bounded(value.scriptURL), state: bounded(value.state) })
    : undefined;
  const result = {
    href: bounded(location.href),
    origin: bounded(location.origin),
    available: { serviceWorker: serviceWorkerApi, cacheStorage: cacheStorageApi },
    controller: serviceWorkerApi ? boundedWorker(navigator.serviceWorker.controller) : undefined,
    registrations: registrations.slice(0, __MAX_REGISTRATIONS__).map((registration) => ({
      scope: bounded(registration.scope),
      updateViaCache: bounded(registration.updateViaCache),
      installing: boundedWorker(registration.installing),
      waiting: boundedWorker(registration.waiting),
      active: boundedWorker(registration.active),
    })),
    cacheNames: [...cacheNames].sort().slice(0, __MAX_CACHE_NAMES__).map(bounded),
    truncated: {
      registrations: registrations.length > __MAX_REGISTRATIONS__,
      cacheNames: cacheNames.length > __MAX_CACHE_NAMES__,
      strings: false,
    },
  };
  result.truncated.strings = stringsTruncated;
  return result;
})()`
  .replaceAll('__MAX_REGISTRATIONS__', String(MAX_REGISTRATIONS))
  .replaceAll('__MAX_CACHE_NAMES__', String(MAX_CACHE_NAMES))
  .replaceAll('__MAX_STRING_LENGTH__', String(HARD_MAX_SNAPSHOT_STRING_LENGTH));

const UPDATE_EXPRESSION = String.raw`(async (scope) => {
  const registrations = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.getRegistrations()
    : [];
  const matches = registrations.filter((registration) => registration.scope === scope);
  if (matches.length !== 1) return { matches: matches.length, requested: false };
  try {
    await matches[0].update();
    return { matches: 1, requested: true };
  } catch (cause) {
    const error = cause && typeof cause === 'object' ? cause : undefined;
    return {
      matches: 1,
      requested: true,
      error: String(error?.message ?? cause ?? 'Service Worker update failed'),
    };
  }
})(__SCOPE__)`;

export async function serviceWorkerScenario(
  options: t.Browser.ServiceWorker.Scenario.Options,
): Promise<t.Browser.ServiceWorker.Scenario.Result> {
  const input = normalizeOptions(options);
  const session = await openChromeSession({ executablePath: input.executablePath });
  let primary: unknown;
  let result: t.Browser.ServiceWorker.Scenario.Result | undefined;

  try {
    result = await runScenario(session, input);
  } catch (cause) {
    primary = Err.normalize(cause);
  }

  if (primary !== undefined) result = undefined;
  await session.close(primary);
  if (!result) throw new Error('Browser Service Worker scenario settled without result evidence.');
  return result;
}

type Input = {
  readonly steps: readonly t.Browser.ServiceWorker.Step[];
  readonly executablePath?: t.StringAbsolutePath;
  readonly timeout: t.Msecs;
  readonly settle: t.Msecs;
  readonly pollInterval: t.Msecs;
  readonly maxDiagnostics: number;
  readonly maxDiagnosticLength: number;
};

type RawUpdate = {
  readonly matches?: unknown;
  readonly requested?: unknown;
  readonly error?: unknown;
};
type CapturedDiagnostic = t.Browser.ServiceWorker.Diagnostics.Entry;

async function runScenario(session: t.Browser.Chrome.Session, input: Input) {
  const target = await attachChromeTarget(session.cdp);
  const diagnostics: CapturedDiagnostic[] = [];
  let omittedDiagnostics = 0;
  let omittedErrors = 0;
  let observedErrors = 0;
  let diagnosticsOpen = true;
  let origin: string | undefined;
  let originGuard: Awaited<ReturnType<typeof guardChromeTargetOrigin>> | undefined;
  let diagnosticCursor = 0;
  let omittedCursor = 0;
  let omittedErrorCursor = 0;
  let retainedStepBytes = 0;
  const steps: t.Browser.ServiceWorker.Step.Result[] = [];

  session.cdp.on((message) => {
    if (!diagnosticsOpen || message.sessionId !== target.sessionId) return;
    const diagnostic = toDiagnostic(message, input.maxDiagnosticLength);
    if (!diagnostic) return;
    if (diagnostic.level === 'error') observedErrors += 1;
    if (diagnostics.length < input.maxDiagnostics) diagnostics.push(diagnostic);
    else {
      omittedDiagnostics += 1;
      if (diagnostic.level === 'error') omittedErrors += 1;
    }
  });
  await enableChromeTarget(session.cdp, target.sessionId);

  const settleOriginGuard = async (deadline: number) => {
    if (!originGuard) return;
    await originGuard.settle(remaining(deadline, 'origin guard'));
  };

  for (const [index, action] of input.steps.entries()) {
    let outcome: t.Browser.ServiceWorker.Step.Outcome;
    let observation: t.Browser.ServiceWorker.Observation;
    const actionTimeout = action.kind === 'observe'
      ? action.timeout ?? input.timeout
      : input.timeout;
    const actionDeadline = Time.now.timestamp + actionTimeout;

    try {
      if (action.kind === 'navigate') {
        const targetUrl = canonicalHttpUrl(action.url, origin);
        if (!origin) {
          const admittedOrigin = targetUrl.origin;
          originGuard = await guardChromeTargetOrigin(
            session.cdp,
            target.sessionId,
            target.mainFrameId,
            admittedOrigin,
          );
          origin = admittedOrigin;
        }
        await navigateChromeTarget(
          session.cdp,
          target.sessionId,
          target.mainFrameId,
          targetUrl.href,
          remaining(actionDeadline, 'navigation'),
        );
        await settleOriginGuard(actionDeadline);
        outcome = Object.freeze({ kind: 'completed' });
      } else if (action.kind === 'reload') {
        assertOriginFixed(origin);
        await reloadChromeTarget(
          session.cdp,
          target.sessionId,
          target.mainFrameId,
          remaining(actionDeadline, 'reload'),
        );
        await settleOriginGuard(actionDeadline);
        outcome = Object.freeze({ kind: 'completed' });
      } else if (action.kind === 'update') {
        assertOriginFixed(origin);
        const scope = canonicalScope(action.scope, origin);
        const update = await evaluateChromeTarget<RawUpdate>(
          session.cdp,
          target.sessionId,
          UPDATE_EXPRESSION.replace('__SCOPE__', () => JSON.stringify(scope)),
          remaining(actionDeadline, 'update'),
        );
        outcome = freezeUpdateOutcome(scope, update);
      } else {
        assertOriginFixed(origin);
        const observed = await pollObservation(
          session.cdp,
          target.sessionId,
          origin,
          action,
          input,
          actionDeadline,
        );
        if (observed.matched) await settleOriginGuard(actionDeadline);
        outcome = Object.freeze({
          kind: 'observed',
          matched: observed.matched,
          attempts: observed.attempts,
        });
        observation = observed.observation;
        const diagnostic = freezeDiagnostics(
          diagnostics.slice(diagnosticCursor),
          omittedDiagnostics - omittedCursor,
          omittedErrors - omittedErrorCursor,
        );
        diagnosticCursor = diagnostics.length;
        omittedCursor = omittedDiagnostics;
        omittedErrorCursor = omittedErrors;
        retainedStepBytes = pushBoundedStep(
          steps,
          freezeStepResult(index, action, outcome, observation, diagnostic),
          retainedStepBytes,
        );
        if (!observed.matched) break;
        continue;
      }

      await waitBounded(
        input.settle,
        remaining(actionDeadline, 'action settlement'),
        'action settlement',
      );
      observation = await snapshot(
        session.cdp,
        target.sessionId,
        origin!,
        remaining(actionDeadline, 'action snapshot'),
      );
      await settleOriginGuard(actionDeadline);
    } catch (cause) {
      if (!pushActionDiagnostic(diagnostics, input, cause)) {
        omittedDiagnostics += 1;
        omittedErrors += 1;
      }
      throw scenarioActionError(cause, diagnostics, omittedDiagnostics, omittedErrors);
    }

    const diagnostic = freezeDiagnostics(
      diagnostics.slice(diagnosticCursor),
      omittedDiagnostics - omittedCursor,
      omittedErrors - omittedErrorCursor,
    );
    diagnosticCursor = diagnostics.length;
    omittedCursor = omittedDiagnostics;
    omittedErrorCursor = omittedErrors;
    retainedStepBytes = pushBoundedStep(
      steps,
      freezeStepResult(index, action, outcome, observation, diagnostic),
      retainedStepBytes,
    );
  }

  if (originGuard) await originGuard.close(HARD_MAX_TIMEOUT);
  await Time.wait(0);
  diagnosticsOpen = false;
  const allDiagnostics = freezeDiagnostics(diagnostics, omittedDiagnostics, omittedErrors);
  const stepsComplete = steps.length === input.steps.length;
  const evidenceComplete = steps.every((step) => {
    const { available, truncated } = step.observation;
    return available.serviceWorker && available.cacheStorage && !truncated.registrations &&
      !truncated.cacheNames && !truncated.strings;
  });
  const actionsSucceeded = steps.every((step) => {
    if (step.outcome.kind === 'observed') return step.outcome.matched;
    if (step.outcome.kind === 'update') {
      return step.outcome.matches === 1 && step.outcome.requested && !step.outcome.error;
    }
    return true;
  });
  const result = Object.freeze({
    ok: stepsComplete && evidenceComplete && actionsSucceeded && observedErrors === 0 &&
      omittedErrors === 0,
    browser: 'Chrome' as const,
    origin: origin!,
    steps: Object.freeze(steps),
    diagnostics: allDiagnostics,
    attestation: 'controlled-run-only' as const,
  });
  assertResultBound(result);
  return result;
}

async function pollObservation(
  cdp: t.Browser.Chrome.Cdp.Client,
  sessionId: string,
  origin: string,
  step: t.Browser.ServiceWorker.Step.Observe,
  input: Input,
  deadline: number,
) {
  const interval = positiveInt(
    step.interval,
    input.pollInterval,
    'observe interval',
    HARD_MAX_POLL_INTERVAL,
  );
  let attempts = 0;
  let observation = await snapshot(cdp, sessionId, origin, remaining(deadline, 'observation'));

  while (true) {
    attempts += 1;
    if (matchesExpectation(observation, step.expect, origin)) {
      return { matched: true, attempts, observation } as const;
    }
    const budget = deadline - Time.now.timestamp;
    if (budget < 1) return { matched: false, attempts, observation } as const;
    await Time.wait(Math.min(interval, budget));
    const afterWait = deadline - Time.now.timestamp;
    if (afterWait < 1) return { matched: false, attempts, observation } as const;
    observation = await snapshot(cdp, sessionId, origin, afterWait);
  }
}

async function snapshot(
  cdp: t.Browser.Chrome.Cdp.Client,
  sessionId: string,
  expectedOrigin: string,
  timeout: t.Msecs,
) {
  const raw = await evaluateChromeTarget<unknown>(cdp, sessionId, SNAPSHOT_EXPRESSION, timeout);
  if (!Is.record(raw) || !Is.str(raw.href) || !Is.str(raw.origin)) {
    throw new Error('Browser Service Worker snapshot returned an invalid shape.');
  }
  boundedString(raw.href, 'snapshot href');
  boundedString(raw.origin, 'snapshot origin');

  if (raw.origin !== expectedOrigin) {
    throw new Error('Browser Service Worker snapshot escaped its fixed origin.');
  }

  const registrations = Array.isArray(raw.registrations)
    ? raw.registrations.map(parseRegistration)
    : invalidSnapshot('registrations');
  const cacheNames = Array.isArray(raw.cacheNames) && raw.cacheNames.every(Is.str)
    ? Object.freeze(raw.cacheNames.map((name) => boundedString(name, 'cache name')))
    : invalidSnapshot('cache names');
  const controller = raw.controller === undefined ? undefined : parseWorker(raw.controller);
  const truncated = parseTruncation(raw.truncated);
  const available = parseAvailability(raw.available);

  return Object.freeze({
    href: raw.href,
    origin: raw.origin,
    available,
    ...(controller ? { controller } : {}),
    registrations: Object.freeze(registrations),
    cacheNames,
    truncated,
  });
}

function matchesExpectation(
  observation: t.Browser.ServiceWorker.Observation,
  expectation: t.Browser.ServiceWorker.Expectation,
  origin: string,
) {
  if (observation.truncated.strings) return false;
  if (expectation.kind === 'cache') {
    if (!observation.available.cacheStorage) return false;
    const present = observation.cacheNames.includes(expectation.name);
    if (!present && observation.truncated.cacheNames) return false;
    return expectation.state === 'present' ? present : !present;
  }
  if (!observation.available.serviceWorker) return false;
  if (expectation.kind === 'registrations') {
    if (observation.truncated.registrations) return false;
    return observation.registrations.length === expectation.count;
  }
  if (expectation.kind === 'controller') {
    return expectation.state === 'present'
      ? observation.controller?.scriptURL === expectation.scriptURL
      : observation.controller === undefined;
  }

  const scope = canonicalScope(expectation.scope, origin);
  const registration = observation.registrations.find((item) => item.scope === scope);
  if (expectation.kind === 'registration') {
    if (!registration && observation.truncated.registrations) return false;
    return expectation.state === 'present'
      ? registration !== undefined
      : registration === undefined;
  }

  if (!registration && observation.truncated.registrations) return false;
  const worker = registration?.[expectation.slot];
  if (expectation.state === 'absent') return worker === undefined;
  return worker?.state === expectation.state && worker.scriptURL === expectation.scriptURL;
}

function parseAvailability(input: unknown) {
  if (!Is.record(input) || !Is.bool(input.serviceWorker) || !Is.bool(input.cacheStorage)) {
    return invalidSnapshot('API availability evidence');
  }
  return Object.freeze({
    serviceWorker: input.serviceWorker,
    cacheStorage: input.cacheStorage,
  });
}

function parseTruncation(input: unknown) {
  if (
    !Is.record(input) || !Is.bool(input.registrations) || !Is.bool(input.cacheNames) ||
    !Is.bool(input.strings)
  ) {
    return invalidSnapshot('truncation evidence');
  }
  return Object.freeze({
    registrations: input.registrations,
    cacheNames: input.cacheNames,
    strings: input.strings,
  });
}

function parseRegistration(input: unknown): t.Browser.ServiceWorker.Registration {
  if (!Is.record(input) || !Is.str(input.scope) || !Is.str(input.updateViaCache)) {
    return invalidSnapshot('registration');
  }
  return Object.freeze({
    scope: boundedString(input.scope, 'registration scope'),
    updateViaCache: boundedString(input.updateViaCache, 'registration updateViaCache'),
    ...(input.installing === undefined ? {} : { installing: parseWorker(input.installing) }),
    ...(input.waiting === undefined ? {} : { waiting: parseWorker(input.waiting) }),
    ...(input.active === undefined ? {} : { active: parseWorker(input.active) }),
  });
}

function parseWorker(input: unknown): t.Browser.ServiceWorker.Worker {
  if (!Is.record(input) || !Is.str(input.scriptURL) || !Is.str(input.state)) {
    return invalidSnapshot('worker');
  }
  return Object.freeze({
    scriptURL: boundedString(input.scriptURL, 'worker script URL'),
    state: workerState(input.state),
  });
}

function workerState(input: string): t.Browser.ServiceWorker.Worker.State {
  switch (input) {
    case 'parsed':
    case 'installing':
    case 'installed':
    case 'activating':
    case 'activated':
    case 'redundant':
      return input;
    default:
      return 'unknown';
  }
}

function normalizeOptions(options: t.Browser.ServiceWorker.Scenario.Options): Input {
  if (!Is.record(options) || !Array.isArray(options.steps) || options.steps.length === 0) {
    throw new TypeError('Browser.ServiceWorker.scenario requires a non-empty steps array.');
  }
  if (options.steps.length > HARD_MAX_STEPS) {
    throw new TypeError(`Browser scenario steps must not exceed ${HARD_MAX_STEPS}.`);
  }
  const steps = Object.freeze(options.steps.map(normalizeStep));
  if (steps[0].kind !== 'navigate') {
    throw new TypeError('Browser.ServiceWorker.scenario must begin with navigate.');
  }

  return Object.freeze({
    steps,
    executablePath: normalizeExecutablePath(options.executablePath),
    timeout: positiveInt(options.timeout, DEFAULT_TIMEOUT, 'timeout', HARD_MAX_TIMEOUT),
    settle: nonNegativeInt(options.settle, DEFAULT_SETTLE, 'settle', HARD_MAX_SETTLE),
    pollInterval: positiveInt(
      options.pollInterval,
      DEFAULT_POLL_INTERVAL,
      'poll interval',
      HARD_MAX_POLL_INTERVAL,
    ),
    maxDiagnostics: positiveInt(
      options.maxDiagnostics,
      DEFAULT_MAX_DIAGNOSTICS,
      'max diagnostics',
      HARD_MAX_DIAGNOSTICS,
    ),
    maxDiagnosticLength: positiveInt(
      options.maxDiagnosticLength,
      DEFAULT_MAX_DIAGNOSTIC_LENGTH,
      'max diagnostic length',
      HARD_MAX_DIAGNOSTIC_LENGTH,
    ),
  });
}

function normalizeExecutablePath(input: unknown): t.StringAbsolutePath | undefined {
  if (input === undefined) return undefined;
  assertChromeExecutableInput(input);
  return input;
}

function normalizeStep(step: t.Browser.ServiceWorker.Step): t.Browser.ServiceWorker.Step {
  if (!Is.record(step) || !Is.str(step.kind)) throw new TypeError('Invalid browser scenario step.');
  if (step.kind === 'navigate' && Is.str(step.url)) {
    return Object.freeze({ kind: step.kind, url: boundedInput(step.url, 'navigate URL') });
  }
  if (step.kind === 'reload') return Object.freeze({ kind: step.kind });
  if (step.kind === 'update' && Is.str(step.scope)) {
    return Object.freeze({ kind: step.kind, scope: boundedInput(step.scope, 'update scope') });
  }
  if (step.kind === 'observe' && Is.record(step.expect)) {
    return Object.freeze({
      kind: step.kind,
      expect: normalizeExpectation(step.expect as t.Browser.ServiceWorker.Expectation),
      ...(step.timeout === undefined
        ? {}
        : { timeout: positiveInt(step.timeout, 0, 'observe timeout', HARD_MAX_TIMEOUT) }),
      ...(step.interval === undefined ? {} : {
        interval: positiveInt(
          step.interval,
          0,
          'observe interval',
          HARD_MAX_POLL_INTERVAL,
        ),
      }),
    });
  }
  throw new TypeError(`Invalid browser scenario step: ${step.kind}.`);
}

function normalizeExpectation(input: t.Browser.ServiceWorker.Expectation) {
  if (!Is.record(input) || !Is.str(input.kind)) {
    throw new TypeError('Invalid browser observation expectation.');
  }
  if (input.kind === 'registrations' && Num.Is.safeInt(input.count) && input.count >= 0) {
    return Object.freeze({ kind: input.kind, count: input.count });
  }
  if (input.kind === 'controller' && input.state === 'absent') {
    return Object.freeze({ kind: input.kind, state: input.state });
  }
  if (input.kind === 'controller' && input.state === 'present' && Is.str(input.scriptURL)) {
    return Object.freeze({
      kind: input.kind,
      state: input.state,
      scriptURL: canonicalScriptUrl(input.scriptURL),
    });
  }
  if (
    input.kind === 'cache' && Is.str(input.name) && input.name &&
    (input.state === 'present' || input.state === 'absent')
  ) {
    return Object.freeze({
      kind: input.kind,
      name: boundedInput(input.name, 'cache name'),
      state: input.state,
    });
  }
  if (
    input.kind === 'registration' && Is.str(input.scope) &&
    (input.state === 'present' || input.state === 'absent')
  ) {
    return Object.freeze({
      kind: input.kind,
      scope: boundedInput(input.scope, 'registration scope'),
      state: input.state,
    });
  }
  if (
    input.kind === 'worker' && Is.str(input.scope) &&
    (input.slot === 'installing' || input.slot === 'waiting' || input.slot === 'active') &&
    input.state === 'absent'
  ) {
    return Object.freeze({
      kind: input.kind,
      scope: boundedInput(input.scope, 'worker scope'),
      slot: input.slot,
      state: input.state,
    });
  }
  if (
    input.kind === 'worker' && Is.str(input.scope) &&
    (input.slot === 'installing' || input.slot === 'waiting' || input.slot === 'active') &&
    workerState(input.state) === input.state && Is.str(input.scriptURL)
  ) {
    return Object.freeze({
      kind: input.kind,
      scope: boundedInput(input.scope, 'worker scope'),
      slot: input.slot,
      state: input.state,
      scriptURL: canonicalScriptUrl(input.scriptURL),
    });
  }
  throw new TypeError(`Invalid browser observation expectation: ${input.kind}.`);
}

function canonicalHttpUrl(input: string, fixedOrigin?: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new TypeError('Browser scenario navigate URL must be absolute HTTP(S).');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('Browser scenario navigate URL must use HTTP(S).');
  }
  if (url.username || url.password) {
    throw new TypeError('Browser scenario navigate URL must not contain credentials.');
  }
  if (fixedOrigin && url.origin !== fixedOrigin) {
    throw new TypeError('Browser scenario navigation must remain on its fixed origin.');
  }
  return url;
}

function canonicalScope(input: string, origin: string) {
  let scope: URL;
  try {
    scope = new URL(input, origin);
  } catch {
    throw new TypeError('Browser scenario update scope is invalid.');
  }
  if (scope.origin !== origin) {
    throw new TypeError('Browser scenario update scope must remain on its fixed origin.');
  }
  scope.hash = '';
  return scope.href;
}

function canonicalScriptUrl(input: string) {
  const url = canonicalHttpUrl(boundedInput(input, 'worker script URL'));
  url.hash = '';
  return url.href;
}

function freezeUpdateOutcome(scope: string, input: RawUpdate) {
  if (
    !Is.record(input) || !Num.Is.safeInt(input.matches) || input.matches < 0 ||
    !Is.bool(input.requested)
  ) {
    throw new Error('Browser Service Worker update returned an invalid shape.');
  }
  return Object.freeze({
    kind: 'update' as const,
    scope,
    matches: input.matches,
    requested: input.requested,
    ...(Is.str(input.error) ? { error: Str.truncate(input.error, 500) } : {}),
  });
}

function pushBoundedStep(
  steps: t.Browser.ServiceWorker.Step.Result[],
  step: t.Browser.ServiceWorker.Step.Result,
  retainedBytes: number,
) {
  const bytes = new TextEncoder().encode(Json.stringify(step, 0)).byteLength;
  if (retainedBytes + bytes > HARD_MAX_RESULT_BYTES) {
    throw new Error(`Browser Service Worker result exceeded ${HARD_MAX_RESULT_BYTES} bytes.`);
  }
  steps.push(step);
  return retainedBytes + bytes;
}

function freezeStepResult(
  index: number,
  action: t.Browser.ServiceWorker.Step,
  outcome: t.Browser.ServiceWorker.Step.Outcome,
  observation: t.Browser.ServiceWorker.Observation,
  diagnostics: t.Browser.ServiceWorker.Diagnostics,
) {
  return Object.freeze({ index, action, outcome, observation, diagnostics });
}

function freezeDiagnostics(
  entries: readonly CapturedDiagnostic[],
  omitted: number,
  omittedErrors = 0,
) {
  return Object.freeze({
    entries: Object.freeze([...entries]),
    truncated: omitted > 0,
    omitted,
    omittedErrors,
  });
}

function toDiagnostic(
  message: t.Browser.Chrome.Cdp.Message,
  maxLength: number,
): CapturedDiagnostic | undefined {
  const params = Is.record(message.params) ? message.params : {};
  if (message.method === 'Runtime.exceptionThrown') {
    const detail = Is.record(params.exceptionDetails) ? params.exceptionDetails : {};
    const exception = Is.record(detail.exception) ? detail.exception : {};
    return diagnostic(
      'runtime',
      'error',
      firstString(exception.description, detail.text),
      maxLength,
    );
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    const level = params.type === 'error'
      ? 'error'
      : params.type === 'warning'
      ? 'warning'
      : undefined;
    if (!level) return undefined;
    const args = Array.isArray(params.args) ? params.args : [];
    const text = args.map((item) => {
      const arg = Is.record(item) ? item : {};
      return firstString(arg.value, arg.description);
    }).join(' ');
    return diagnostic('console', level, text, maxLength);
  }
  if (message.method === 'Log.entryAdded') {
    const entry = Is.record(params.entry) ? params.entry : {};
    const level = entry.level === 'error'
      ? 'error'
      : entry.level === 'warning'
      ? 'warning'
      : undefined;
    if (!level) return undefined;
    return diagnostic('log', level, firstString(entry.text, entry.url), maxLength);
  }
  return undefined;
}

function diagnostic(
  source: t.Browser.ServiceWorker.Diagnostics.Entry['source'],
  level: t.Browser.ServiceWorker.Diagnostics.Entry['level'],
  text: string,
  maxLength: number,
) {
  const normalized = text || `${source} ${level}`;
  return Object.freeze({
    source,
    level,
    text: Str.truncate(normalized, maxLength),
    truncated: normalized.length > maxLength,
  });
}

function pushActionDiagnostic(
  diagnostics: CapturedDiagnostic[],
  input: Input,
  cause: unknown,
) {
  if (diagnostics.length >= input.maxDiagnostics) return false;
  diagnostics.push(
    diagnostic('navigation', 'error', Err.std(cause).message, input.maxDiagnosticLength),
  );
  return true;
}

function scenarioActionError(
  cause: unknown,
  diagnostics: readonly CapturedDiagnostic[],
  omitted: number,
  omittedErrors: number,
) {
  const error = cause instanceof Error ? cause : Err.normalize(cause);
  Object.defineProperty(error, 'diagnostics', {
    value: freezeDiagnostics(diagnostics, omitted, omittedErrors),
    enumerable: true,
    configurable: false,
    writable: false,
  });
  return error;
}

function firstString(...values: readonly unknown[]) {
  for (const value of values) if (Is.str(value)) return value;
  return '';
}

function positiveInt(
  input: unknown,
  fallback: number,
  label: string,
  maximum: number,
) {
  if (input === undefined) return fallback;
  if (!Num.Is.safeInt(input) || input < 1 || input > maximum) {
    throw new TypeError(`Browser scenario ${label} must be an integer from 1 to ${maximum}.`);
  }
  return input;
}

function nonNegativeInt(
  input: unknown,
  fallback: number,
  label: string,
  maximum: number,
) {
  if (input === undefined) return fallback;
  if (!Num.Is.safeInt(input) || input < 0 || input > maximum) {
    throw new TypeError(`Browser scenario ${label} must be an integer from 0 to ${maximum}.`);
  }
  return input;
}

function boundedInput(input: string, label: string) {
  if (input.length > HARD_MAX_INPUT_LENGTH) {
    throw new TypeError(
      `Browser scenario ${label} must not exceed ${HARD_MAX_INPUT_LENGTH} characters.`,
    );
  }
  return input;
}

function boundedString(input: string, label: string) {
  if (input.length > HARD_MAX_SNAPSHOT_STRING_LENGTH) {
    throw new Error(
      `Browser Service Worker ${label} exceeded ${HARD_MAX_SNAPSHOT_STRING_LENGTH} characters.`,
    );
  }
  return input;
}

function assertResultBound(result: unknown) {
  const bytes = new TextEncoder().encode(Json.stringify(result, 0)).byteLength;
  if (bytes > HARD_MAX_RESULT_BYTES) {
    throw new Error(`Browser Service Worker result exceeded ${HARD_MAX_RESULT_BYTES} bytes.`);
  }
}

function remaining(deadline: number, label: string) {
  const value = deadline - Time.now.timestamp;
  if (value < 1) throw new Error(`Browser Service Worker ${label} timed out.`);
  return value;
}

async function waitBounded(wait: number, budget: number, label: string) {
  if (wait > budget) throw new Error(`Browser Service Worker ${label} exceeds its timeout.`);
  await Time.wait(wait);
}

function assertOriginFixed(origin?: string): asserts origin is string {
  if (!origin) throw new TypeError('Browser scenario must establish origin with navigate first.');
}

function invalidSnapshot(field: string): never {
  throw new Error(`Browser Service Worker snapshot returned invalid ${field}.`);
}
