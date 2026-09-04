import { DistServer } from '@sys/server/dist';
import { PiFs } from '../../u.fs.ts';
import { Arr, Err, Fs, Is, Num, Obj, Str, type t, Time } from '../common.ts';
import type { Start } from '../u.start/u.gui/t.ts';
import { START_GUI_RELEASE_EVIDENCE } from './u.start.gui.service.evidence.ts';

const AUTHORITY_LIMITS = Object.freeze({
  manifestUrl: 4096,
  developmentDir: 4096,
  integrity: 'sha256-'.length + 64,
  packageName: 256,
  packageVersion: 256,
});

const VERIFY_LIMITS = Object.freeze({
  manifestBytes: 16 * 1024 * 1024,
  entries: 4096 * 2 + 1,
  fileBytes: 128 * 1024 * 1024,
  totalBytes: 1024 * 1024 * 1024,
});

const BROWSER_POLICY = Object.freeze({
  kind: 'verified-loopback',
  dedicatedWorkers: Object.freeze([]),
  serviceWorker: Object.freeze({ kind: 'tombstone', path: 'sw.js' }),
}) satisfies t.DistServer.BrowserPolicy.Input;

const RECOVERY_POLICY: Start.Gui.Recovery.Policy = Object.freeze({
  kind: 'local-evidence-binding',
  manifestChecksumMismatch:
    'Intended local build? In Driver Pi run deno task bind:dev, then relaunch.',
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

void Arr;
void Num;
void Obj;
void Str;
void Time;

/**
 * Snapshot the fixed generated release evidence before acquiring runtime owners.
 */
export function snapshotReleaseAuthority(): Start.Gui.Authority.Snapshot {
  return snapshotAuthority(START_GUI_SERVICE.source);
}

/**
 * Snapshot one package-internal completed development build.
 */
export function snapshotDevelopmentAuthority(input: unknown): Start.Gui.Authority.Snapshot {
  return snapshotAuthority(input);
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
    integrity: authority.integrity,
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
    integrity: authority.integrity,
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
export function admitGenerationPkg(
  authority: Start.Gui.Release.Authority,
  generation: t.Dist.Existing | t.Dist.Promoted,
): t.StringAbsoluteDir | undefined {
  return samePkg(generation.verification.dist.pkg, authority.expectedPkg)
    ? generation.dir
    : undefined;
}

/**
 * Admit the independently verified package identity of a newly started host.
 */
export function admitApplicationPkg(
  authority: Start.Gui.Authority,
  started: Pick<t.DistServer.Started, 'origin' | 'verification'>,
): Readonly<{ origin: t.StringUrl; digest: t.StringHash }> | undefined {
  if (!samePkg(started.verification.dist.pkg, authority.expectedPkg)) return;
  return Object.freeze({
    origin: started.origin,
    digest: started.verification.dist.hash.digest,
  });
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
function snapshotAuthority(input: unknown): Start.Gui.Authority.Snapshot {
  if (!Is.plainObject(input)) return invalidAuthority('package-identity');
  const source = input;
  let snapshot: Start.Gui.Configuration.Snapshot<Start.Gui.Authority>;
  if (source.kind === 'release') snapshot = snapshotRelease(source);
  else if (source.kind === 'development') snapshot = snapshotDevelopment(source);
  else return invalidAuthority('package-identity');
  return snapshot.ok
    ? Object.freeze({ ok: true, authority: snapshot.value })
    : invalidAuthority(snapshot.reason);
}

function snapshotRelease(
  input: Record<string, unknown>,
): Start.Gui.Configuration.Snapshot<Start.Gui.Release.Authority> {
  const source = manifestSource(input.manifestUrl);
  if (!source) return Object.freeze({ ok: false, reason: 'manifest-url' });
  const integrity = snapshotIntegrity(input.integrity);
  if (!integrity) return Object.freeze({ ok: false, reason: 'integrity' });
  const expectedPkg = snapshotPkg(input.expectedPkg);
  if (!expectedPkg) return Object.freeze({ ok: false, reason: 'package-identity' });
  return Object.freeze({
    ok: true,
    value: Object.freeze({ kind: 'release', source, integrity, expectedPkg }),
  });
}

function snapshotDevelopment(
  input: Record<string, unknown>,
): Start.Gui.Configuration.Snapshot<Start.Gui.Development.Authority> {
  const dir = input.dir;
  if (!boundedString(dir, AUTHORITY_LIMITS.developmentDir) || !Fs.Path.Is.absolute(dir)) {
    return Object.freeze({ ok: false, reason: 'development-directory' });
  }
  const integrity = snapshotIntegrity(input.integrity);
  if (!integrity) return Object.freeze({ ok: false, reason: 'integrity' });
  const expectedPkg = snapshotPkg(input.expectedPkg);
  if (!expectedPkg) return Object.freeze({ ok: false, reason: 'package-identity' });
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      kind: 'development',
      dir,
      integrity,
      expectedPkg,
    }),
  });
}

function snapshotPkg(input: unknown): Readonly<t.Pkg> | undefined {
  if (!Is.plainObject(input)) return;
  const pkg = input;
  if (
    !boundedString(pkg.name, AUTHORITY_LIMITS.packageName) ||
    !boundedString(pkg.version, AUTHORITY_LIMITS.packageVersion)
  ) return;
  return Object.freeze({ name: pkg.name, version: pkg.version });
}

function snapshotIntegrity(input: unknown): t.StringHash | undefined {
  const prefix = 'sha256-';
  if (
    !Is.string(input) || input.length !== AUTHORITY_LIMITS.integrity ||
    !input.startsWith(prefix)
  ) return;
  // Integrity admission validates every digest code unit without allocating a second string.
  for (let index = prefix.length; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (!((code >= 0x30 && code <= 0x39) || (code >= 0x61 && code <= 0x66))) return;
  }
  return input;
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
    : reason === 'integrity'
    ? 'Invalid start:gui manifest integrity.'
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
  if (result.stage === 'manifest-fetch' && result.reason === 'integrity-mismatch') {
    return Object.freeze({
      kind: 'materialization',
      stage: result.stage,
      reason: result.reason,
      cleanup: result.cleanup,
      manifestChecksum: Object.freeze({
        expected: result.manifestChecksum.expected,
        received: result.manifestChecksum.received,
      }),
    });
  }
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
