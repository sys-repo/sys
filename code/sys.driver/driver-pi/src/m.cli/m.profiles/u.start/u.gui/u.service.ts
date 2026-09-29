import { DistServer } from '@sys/server/dist';
import { PiFs } from '../../../../m.core/u.fs.ts';
import { Err, Fs, Is, Obj, Pkg, type t } from '../common.ts';
import type { Start } from './t.ts';
import { START_GUI_RELEASE_EVIDENCE } from './u.service.evidence.ts';
import { readGuiPackage, snapshotGuiPackage } from './u.pkg.ts';
import { AUTHORITY_LIMITS, VERIFY_LIMITS } from './u.policy.ts';

const BROWSER_POLICY = Object.freeze({
  kind: 'verified-loopback',
  dedicatedWorkers: Object.freeze([]),
  serviceWorker: Object.freeze({ kind: 'tombstone', path: 'sw.js' }),
}) satisfies t.DistServer.BrowserPolicy.Input;

const RECOVERY_POLICY: Start.Gui.Recovery.Policy = Object.freeze({
  kind: 'local-evidence-binding',
  contentPinRefused: 'See Driver Pi README: Local GUI workflow — source-checkout launcher.',
});

const STORE_POLICY: Start.Gui.Store.Policy = Object.freeze({
  root: '.pi/@sys/dist',
  target: PiFs.root,
});

/**
 * Immutable Driver Pi policy for one canonical GUI release.
 */
export const START_GUI_SERVICE = Object.freeze({
  name: 'sys.ui:pi',
  source: START_GUI_RELEASE_EVIDENCE,
  store: STORE_POLICY,
  recovery: RECOVERY_POLICY,
  authorityLimits: AUTHORITY_LIMITS,
  limits: VERIFY_LIMITS,
  browserPolicy: BROWSER_POLICY,
});

/**
 * Snapshot the fixed generated release evidence before acquiring runtime owners.
 */
export function snapshotReleaseAuthority(
  input: unknown = START_GUI_SERVICE.source,
): Start.Gui.Authority.Snapshot {
  return snapshotAuthority(input, 'release');
}

/**
 * Snapshot one package-internal completed development build.
 */
export function snapshotDevelopmentAuthority(input: unknown): Start.Gui.Authority.Snapshot {
  return snapshotAuthority(input, 'development');
}

/**
 * Build the canonical Generation-open arguments selected by Driver Pi.
 */
export function generationOpenArgs(
  root: t.StringDir,
  authority: Start.Gui.Release.Authority,
  until: AbortSignal,
): t.Dist.Generation.Open.Args {
  return Object.freeze({
    store: Object.freeze({
      root: Fs.join(root, START_GUI_SERVICE.store.root),
      target: START_GUI_SERVICE.store.target,
    }),
    manifestUrl: authority.source.href,
    pin: authority.pin,
    policy: materializePolicy(authority.source),
    until,
  });
}

/**
 * Build the pinned verified-host arguments selected by Driver Pi.
 */
export function applicationStartArgs(
  authority: Start.Gui.Authority,
  dir: t.StringAbsoluteDir,
  until: AbortSignal,
): t.DistServer.Start.Args {
  return Object.freeze({
    dir,
    pin: authority.pin,
    limits: START_GUI_SERVICE.limits,
    hostname: '127.0.0.1',
    port: 0,
    browserPolicy: START_GUI_SERVICE.browserPolicy,
    silent: true,
    until,
  });
}

/**
 * Admit the package identity of a newly opened release Generation.
 */
export async function admitGenerationPkg(
  authority: Start.Gui.Release.Authority,
  generation: t.Dist.Existing | t.Dist.Promoted,
  until: AbortSignal,
  readPart?: Start.Gui.Dependencies['readPart'],
): Promise<t.StringAbsoluteDir | undefined> {
  const { dir, verification } = generation;
  const observed = await readGuiPackage(dir, verification.content, until, readPart);
  return !until.aborted && samePkg(observed, authority.expectedPkg) ? dir : undefined;
}

/**
 * Admit the independently verified package identity of a newly started host.
 */
export async function admitApplicationPkg(
  authority: Start.Gui.Authority,
  dir: t.StringAbsoluteDir,
  started: Pick<t.DistServer.Started, 'origin' | 'verification'>,
  until: AbortSignal,
  readPart?: Start.Gui.Dependencies['readPart'],
): Promise<Readonly<{ origin: t.StringUrl; digest: t.StringHash }> | undefined> {
  const { origin, verification } = started;
  const { content } = verification;
  const observed = await readGuiPackage(dir, content, until, readPart);
  if (until.aborted || !samePkg(observed, authority.expectedPkg)) return;
  return Object.freeze({ origin, digest: content.digest });
}

/**
 * Build bounded refusal evidence for either independent package check.
 */
export function packageRefusal(): Start.Gui.Failure {
  return failure(
    'artifact-refused',
    Object.freeze({ kind: 'identity' }),
    Err.std('start:gui refused GUI Dist package identity.'),
  );
}

/**
 * Convert a failed Generation opening into finite Driver Pi failure evidence.
 */
export function generationOpenFailure(
  result: t.Dist.Generation.Failure.Result,
): Start.Gui.Failure {
  if (result.generation) {
    const evidence = snapshotMaterialization(result.generation);
    return failure(
      materializationCategory(evidence),
      evidence,
      Err.std(`start:gui materialization failed: ${evidence.stage}/${evidence.reason}`),
    );
  }
  if (result.reason === 'cancelled') {
    return failure(
      'cancelled',
      Object.freeze({ kind: 'cancellation' }),
      Err.std('start:gui generation opening cancelled.'),
    );
  }
  return localFailure('release-owner');
}

/**
 * Map one lower failure to bounded browser and terminal evidence.
 */
export function captureStartGuiFailure(
  cause: unknown,
  operation: Start.Gui.Failure.Operation,
): Start.Gui.Failure {
  if (DistServer.Error.is(cause)) {
    return failure(
      hostCategory(cause.reason),
      Object.freeze({ kind: 'application-host', reason: cause.reason }),
      cause,
    );
  }
  return localFailure(operation, cause);
}

/**
 * Build the infrastructure failure used when an owned listener terminates autonomously.
 */
export function listenerFailure(
  operation: Extract<Start.Gui.Failure.Operation, 'application-listener' | 'status-listener'>,
  cause?: unknown,
): Start.Gui.Failure {
  const message = operation === 'application-listener'
    ? 'start:gui application listener stopped.'
    : 'start:gui bootstrap listener stopped.';
  return failure(
    'local-failure',
    Object.freeze({ kind: 'local', operation }),
    cause === undefined ? Err.std(message) : Err.std(cause),
  );
}

/**
 * Helpers:
 */
function snapshotAuthority(
  input: unknown,
  kind: Start.Gui.Authority['kind'],
): Start.Gui.Authority.Snapshot {
  if (!Is.plainObject(input) || input.kind !== kind) return invalidAuthority('package-identity');
  if (Obj.hasOwn(input, 'integrity')) return invalidAuthority('pin');
  const snapshot = kind === 'release' ? snapshotRelease(input) : snapshotDevelopment(input);
  return snapshot.ok
    ? Object.freeze({ ok: true, authority: snapshot.value })
    : invalidAuthority(snapshot.reason);
}

function snapshotRelease(
  input: Record<string, unknown>,
): Start.Gui.Configuration.Snapshot<Start.Gui.Release.Authority> {
  const source = manifestSource(input.manifestUrl);
  if (!source) return Object.freeze({ ok: false, reason: 'manifest-url' });
  const pin = snapshotPin(input.pin);
  if (!pin) return Object.freeze({ ok: false, reason: 'pin' });
  const expectedPkg = snapshotGuiPackage(input.expectedPkg);
  if (!expectedPkg) return Object.freeze({ ok: false, reason: 'package-identity' });
  return Object.freeze({
    ok: true,
    value: Object.freeze({ kind: 'release', source, pin, expectedPkg }),
  });
}

function snapshotDevelopment(
  input: Record<string, unknown>,
): Start.Gui.Configuration.Snapshot<Start.Gui.Development.Authority> {
  const dir = input.dir;
  if (!boundedString(dir, AUTHORITY_LIMITS.developmentDir) || !Fs.Path.Is.absolute(dir)) {
    return Object.freeze({ ok: false, reason: 'development-directory' });
  }
  const pin = snapshotPin(input.pin);
  if (!pin) return Object.freeze({ ok: false, reason: 'pin' });
  const expectedPkg = snapshotGuiPackage(input.expectedPkg);
  if (!expectedPkg) return Object.freeze({ ok: false, reason: 'package-identity' });
  return Object.freeze({
    ok: true,
    value: Object.freeze({ kind: 'development', dir, pin, expectedPkg }),
  });
}

function snapshotPin(input: unknown): t.DistPin | undefined {
  if (!Pkg.Is.distPin(input)) return;
  return Object.freeze({ scheme: input.scheme, digest: input.digest });
}

function manifestSource(input: unknown): Start.Gui.Manifest.Source | undefined {
  if (!boundedString(input, AUTHORITY_LIMITS.manifestUrl)) return;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return;
  }
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password ||
    url.search || url.hash || hasUserinfo(input)
  ) return;
  return Object.freeze({ href: url.href, origin: url.origin });
}

function invalidAuthority(
  reason: Start.Gui.Configuration.Reason,
): Start.Gui.Authority.Snapshot {
  const message = reason === 'manifest-url'
    ? 'Invalid start:gui manifest URL.'
    : reason === 'pin'
    ? 'Invalid start:gui content pin; rebuild and explicitly bind supported evidence.'
    : reason === 'development-directory'
    ? 'Invalid start:gui development directory.'
    : 'Invalid start:gui package identity.';
  return Object.freeze({
    ok: false,
    failure: failure(
      'configuration-invalid',
      Object.freeze({ kind: 'configuration', reason }),
      Err.std(message),
    ),
  });
}

function materializePolicy(source: Start.Gui.Manifest.Source): t.Dist.Policy {
  const response = Object.freeze({
    maxBytes: 128 * 1024 * 1024,
    timeout: 60_000,
    maxRedirects: 3,
    progressInterval: 100,
    sourceOrigins: Object.freeze([source.origin]),
    credentialOrigins: Object.freeze([]),
  });
  return Object.freeze({
    manifest: Object.freeze({ ...response, maxBytes: 16 * 1024 * 1024, timeout: 30_000 }),
    resources: Object.freeze({
      response,
      maxResources: 4096,
      concurrency: 4,
      maxAttempts: 4,
      retryDelay: 250,
      maxRetryElapsed: 2 * 60_000,
      maxTotalBytes: 1024 * 1024 * 1024,
      totalTimeout: 10 * 60_000,
    }),
    verification: START_GUI_SERVICE.limits,
  });
}

function snapshotMaterialization(
  result: t.Dist.Failed,
): Start.Gui.Failure.MaterializationEvidence {
  return Object.freeze({
    kind: 'materialization',
    stage: result.stage,
    reason: result.reason,
    cleanup: result.cleanup,
    ...(result.publication === undefined ? {} : { publication: result.publication }),
  });
}

function materializationCategory(
  evidence: Start.Gui.Failure.MaterializationEvidence,
): Start.Gui.Failure.Category {
  if (evidence.reason === 'cancelled') return 'cancelled';
  if (evidence.stage === 'existing-verification' && evidence.publication === 'occupied') {
    return 'repair-required';
  }
  if (evidence.reason === 'invalid-input' || evidence.reason === 'invalid-policy') {
    return 'configuration-invalid';
  }
  if (
    (evidence.stage === 'manifest-fetch' || evidence.stage === 'resource-pull') &&
    (evidence.reason === 'source-denied' || evidence.reason === 'timeout' ||
      evidence.reason === 'resource-failure')
  ) return 'source-unavailable';
  if (
    evidence.reason === 'filesystem-failure' || evidence.reason === 'unsupported' ||
    evidence.reason === 'execution-failure'
  ) return 'local-failure';
  return 'artifact-refused';
}

function hostCategory(reason: t.DistServer.StartFailureReason): Start.Gui.Failure.Category {
  if (reason === 'cancelled') return 'cancelled';
  if (reason === 'invalid-input' || reason === 'invalid-hostname') {
    return 'configuration-invalid';
  }
  if (
    reason === 'io-failure' || reason === 'unsupported' || reason === 'address-in-use' ||
    reason === 'startup-failure'
  ) return 'local-failure';
  return 'artifact-refused';
}

function localFailure(
  operation: Start.Gui.Failure.Operation,
  cause?: unknown,
): Start.Gui.Failure {
  return failure(
    'local-failure',
    Object.freeze({ kind: 'local', operation }),
    cause === undefined ? Err.std(`start:gui ${operation} failed.`) : Err.std(cause),
  );
}

function failure(
  category: Start.Gui.Failure.Category,
  evidence: Start.Gui.Failure.Evidence,
  error: Error,
): Start.Gui.Failure {
  return Object.freeze({ category, evidence, error });
}

function samePkg(observed: Readonly<t.Pkg> | undefined, expected: Readonly<t.Pkg>): boolean {
  return observed?.name === expected.name && observed.version === expected.version;
}

function boundedString(input: unknown, max: number): input is string {
  if (!Is.string(input) || input.length === 0 || input.length > max) return false;
  // Bounded policy strings reject every embedded control code unit.
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return false;
  }
  return true;
}

function hasUserinfo(input: string): boolean {
  const scheme = input.indexOf('://');
  if (scheme < 0) return false;
  const remainder = input.slice(scheme + 3);
  const slash = remainder.indexOf('/');
  return (slash < 0 ? remainder : remainder.slice(0, slash)).includes('@');
}
