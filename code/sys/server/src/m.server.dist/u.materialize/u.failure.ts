import { Is } from '@sys/std/is/server';
import { Num, Pkg, type t } from './common.ts';

const INVALID = Symbol('invalid-data-property');
const EXECUTION_FAILURE = Object.freeze(
  {
    ok: false,
    reason: 'execution-failure',
  } as const,
);

type NonManifestStage = Exclude<t.Dist.FailureStage, 'manifest-fetch'>;
type NonIntegrityReason = Exclude<t.Dist.FailureReason, 'integrity-mismatch'>;
type FailedWithoutManifestChecksum = Exclude<t.Dist.Failed, t.Dist.ManifestChecksumFailed>;

/** Build one frozen sanitized materialization failure outside the diagnostic mismatch variant. */
export function failed(
  stage: 'manifest-fetch',
  reason: NonIntegrityReason,
  cleanup?: t.Dist.Cleanup,
  publication?: t.Dist.FailedPublication,
): FailedWithoutManifestChecksum;
export function failed(
  stage: NonManifestStage,
  reason: t.Dist.FailureReason,
  cleanup?: t.Dist.Cleanup,
  publication?: t.Dist.FailedPublication,
): FailedWithoutManifestChecksum;
export function failed(
  stage: t.Dist.FailureStage,
  reason: t.Dist.FailureReason,
  cleanup: t.Dist.Cleanup = 'not-needed',
  publication?: t.Dist.FailedPublication,
): FailedWithoutManifestChecksum {
  if (stage === 'manifest-fetch') {
    const safeReason = reason === 'integrity-mismatch' ? 'execution-failure' : reason;
    return Object.freeze({
      kind: 'failed',
      stage,
      reason: safeReason,
      cleanup,
      ...(publication ? { publication } : {}),
    });
  }
  return Object.freeze({
    kind: 'failed',
    stage,
    reason,
    cleanup,
    ...(publication ? { publication } : {}),
  });
}

/** Build the one failure variant that retains bounded manifest checksum evidence. */
export function failedManifestChecksum(
  manifestChecksum: t.Dist.ManifestChecksumMismatch,
): t.Dist.ManifestChecksumFailed {
  return Object.freeze({
    kind: 'failed',
    stage: 'manifest-fetch',
    reason: 'integrity-mismatch',
    cleanup: 'not-needed',
    manifestChecksum: Object.freeze({
      expected: manifestChecksum.expected,
      received: manifestChecksum.received,
    }),
  });
}

export type ManifestFetchFailure =
  | Readonly<{
    ok: false;
    reason: 'integrity-mismatch';
    manifestChecksum: t.Dist.ManifestChecksumMismatch;
  }>
  | Readonly<{
    ok: false;
    reason: NonIntegrityReason;
    manifestChecksum?: undefined;
  }>;

export type ManifestResponse =
  | ManifestFetchFailure
  | Readonly<{
    ok: true;
    data: Blob;
    requestedUrl: t.StringUrl;
    finalUrl: t.StringUrl;
  }>;

type ManifestChecksumObservation =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'valid' }>
  | Readonly<{
    kind: 'mismatch';
    evidence: t.Dist.ManifestChecksumMismatch;
  }>
  | Readonly<{ kind: 'invalid' }>;

type FetchFailureObservation = Readonly<{
  status: t.HttpStatusCode;
  policyFailure?: t.HttpFetch.ResponsePolicy.FailureKind;
}>;

/** Snapshot one lower Fetch response without invoking caller-owned properties or Proxy traps. */
export function admitManifestResponse(
  response: unknown,
  expected: t.StringHash,
): ManifestResponse {
  try {
    if (!isDataRecord(response)) return EXECUTION_FAILURE;
    const ok = ownData(response, 'ok');
    if (ok === true) return admitManifestSuccess(response, expected);
    if (ok === false) return admitManifestFailure(response, expected);
    return EXECUTION_FAILURE;
  } catch {
    return EXECUTION_FAILURE;
  }
}

function admitManifestSuccess(
  response: Record<PropertyKey, unknown>,
  expected: t.StringHash,
): ManifestResponse {
  const checksum = observeManifestChecksum(ownData(response, 'checksum'), expected);
  const data = ownData(response, 'data');
  const requestedUrl = ownData(response, 'requestedUrl');
  const finalUrl = ownData(response, 'finalUrl');
  if (
    checksum.kind !== 'valid' ||
    !Is.object(data) ||
    Is.Native.proxy(data) ||
    !(data instanceof Blob) ||
    !Is.str(requestedUrl) ||
    !Is.str(finalUrl)
  ) {
    return EXECUTION_FAILURE;
  }
  return Object.freeze({
    ok: true,
    data,
    requestedUrl,
    finalUrl,
  });
}

function admitManifestFailure(
  response: Record<PropertyKey, unknown>,
  expected: t.StringHash,
): ManifestFetchFailure {
  const status = ownData(response, 'status');
  if (!isHttpStatus(status)) return EXECUTION_FAILURE;
  const policyFailure = observePolicyFailure(ownData(response, 'error'));
  if (!policyFailure.ok) return EXECUTION_FAILURE;

  const checksum = observeManifestChecksum(ownData(response, 'checksum'), expected);
  if (checksum.kind === 'mismatch') {
    return status === 412 && policyFailure.value === undefined
      ? Object.freeze({
        ok: false,
        reason: 'integrity-mismatch',
        manifestChecksum: checksum.evidence,
      })
      : EXECUTION_FAILURE;
  }
  if (checksum.kind !== 'absent') return EXECUTION_FAILURE;

  return Object.freeze({
    ok: false,
    reason: fetchReason({ status, policyFailure: policyFailure.value }),
  });
}

/** Admit checksum evidence from the lower HTTP owner without invoking accessors. */
function observeManifestChecksum(
  checksum: unknown,
  expected: t.StringHash,
): ManifestChecksumObservation {
  if (checksum === undefined) return Object.freeze({ kind: 'absent' });
  if (!isDataRecord(checksum)) return Object.freeze({ kind: 'invalid' });

  const keys = Reflect.ownKeys(checksum);
  if (
    keys.length !== 3 ||
    !keys.includes('valid') ||
    !keys.includes('expected') ||
    !keys.includes('received')
  ) {
    return Object.freeze({ kind: 'invalid' });
  }

  const valid = ownData(checksum, 'valid');
  const reportedExpected = ownData(checksum, 'expected');
  const received = ownData(checksum, 'received');
  if (
    !Is.bool(valid) ||
    reportedExpected !== expected ||
    !isCanonicalHash(reportedExpected) ||
    !isCanonicalHash(received) ||
    valid !== (received === expected)
  ) {
    return Object.freeze({ kind: 'invalid' });
  }
  if (valid) return Object.freeze({ kind: 'valid' });

  const evidence = Object.freeze({ expected, received });
  return Object.freeze({ kind: 'mismatch', evidence });
}

function observePolicyFailure(
  error: unknown,
): Readonly<
  | { ok: true; value?: t.HttpFetch.ResponsePolicy.FailureKind }
  | { ok: false }
> {
  if (!isDataRecord(error)) return Object.freeze({ ok: false });
  const descriptor = Object.getOwnPropertyDescriptor(error, 'policyFailure');
  if (!descriptor) return Object.freeze({ ok: true });
  const value = dataValue(descriptor);
  if (value === INVALID) return Object.freeze({ ok: false });
  if (value === undefined) return Object.freeze({ ok: true });
  return isPolicyFailure(value) ? Object.freeze({ ok: true, value }) : Object.freeze({ ok: false });
}

function isDataRecord(input: unknown): input is Record<PropertyKey, unknown> {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  if (Object.getOwnPropertyDescriptor(input, Symbol.toStringTag)) return false;
  const prototype = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}

function ownData(input: object, key: PropertyKey): unknown | typeof INVALID {
  return dataValue(Object.getOwnPropertyDescriptor(input, key));
}

function dataValue(descriptor: PropertyDescriptor | undefined): unknown | typeof INVALID {
  return descriptor && 'value' in descriptor ? descriptor.value : INVALID;
}

function isHttpStatus(input: unknown): input is t.HttpStatusCode {
  return Num.Is.safeInt(input) && input >= 100 && input <= 599;
}

function isCanonicalHash(input: unknown): input is t.StringHash {
  if (!Is.str(input)) return false;
  const parsed = Pkg.Dist.Part.parse(input);
  return Boolean(parsed && parsed.hash === input && parsed.size === undefined);
}

function isPolicyFailure(input: unknown): input is t.HttpFetch.ResponsePolicy.FailureKind {
  switch (input) {
    case 'invalid-policy':
    case 'invalid-request':
    case 'invalid-url':
    case 'source-denied':
    case 'redirect-invalid':
    case 'redirect-downgrade':
    case 'redirect-loop':
    case 'redirect-limit':
    case 'response-timeout':
    case 'response-too-large':
    case 'progress-failure':
      return true;
    default:
      return false;
  }
}

/** Classify a thrown host or Rooted failure without exposing its cause. */
export function causeReason(
  cause: unknown,
  isRootedFailure: t.FsRooted.IsLib['failure'],
): NonIntegrityReason {
  if (isRootedFailure(cause)) {
    if (cause.kind === 'cancelled') return 'cancelled';
    if (cause.kind === 'unsupported') return 'unsupported';
    return 'filesystem-failure';
  }
  return 'execution-failure';
}

/** Classify one safely captured bounded manifest Fetch failure. */
function fetchReason(response: FetchFailureObservation): NonIntegrityReason {
  if (response.status === 499) return 'cancelled';
  switch (response.policyFailure) {
    case 'invalid-policy':
      return 'invalid-policy';
    case 'invalid-request':
    case 'invalid-url':
      return 'invalid-input';
    case 'source-denied':
    case 'redirect-downgrade':
      return 'source-denied';
    case 'response-timeout':
      return 'timeout';
    case 'response-too-large':
      return 'limit-exceeded';
    default:
      return response.status === 408 ? 'timeout' : 'resource-failure';
  }
}

/** Classify one checksum-pinned Pull failure. */
export function pullReason(
  result: t.HttpPull.ResultFailure,
): t.Dist.FailureReason {
  const kind = result.terminal?.kind ?? result.ops.find((item) => !item.ok)?.kind;
  switch (kind) {
    case 'invalid-input':
    case 'invalid-resource':
      return 'invalid-input';
    case 'invalid-policy':
      return 'invalid-policy';
    case 'cancelled':
      return 'cancelled';
    case 'source-denied':
      return 'source-denied';
    case 'retry-limit':
    case 'total-timeout':
      return 'timeout';
    case 'resource-limit':
    case 'file-limit':
    case 'aggregate-limit':
      return 'limit-exceeded';
    case 'checksum-mismatch':
      return 'integrity-mismatch';
    case 'target-admission':
    case 'publication-failure':
      return 'filesystem-failure';
    default:
      return 'resource-failure';
  }
}

/** Classify one pinned verification failure. */
export function verificationReason(
  result: t.FsPkg.Dist.Pinned.Verify.Failure,
): t.Dist.FailureReason {
  switch (result.kind) {
    case 'invalid-input':
      return 'invalid-policy';
    case 'cancelled':
      return 'cancelled';
    case 'limit-exceeded':
      return 'limit-exceeded';
    case 'integrity-mismatch':
      return 'integrity-mismatch';
    case 'malformed':
      return 'malformed-manifest';
    default:
      return 'verification-failure';
  }
}
