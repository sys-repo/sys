import { Is, Num, type t } from './common.ts';

type FetchFailureObservation = Readonly<{
  status: t.HttpStatusCode;
  policyFailure?: t.HttpFetch.ResponsePolicy.FailureKind;
}>;

const INVALID = Symbol('invalid-data-property');
const EXECUTION_FAILURE = Object.freeze({ ok: false, reason: 'execution-failure' } as const);

/** Build one frozen sanitized materialization failure. */
export function failed(
  stage: t.Dist.FailureStage,
  reason: t.Dist.FailureReason,
  cleanup: t.Dist.Cleanup = 'not-needed',
  publication?: t.Dist.FailedPublication,
): t.Dist.Failed {
  return Object.freeze({
    kind: 'failed',
    stage,
    reason,
    cleanup,
    ...(publication ? { publication } : {}),
  });
}

/** Capture bounded transport observations; manifest content authority is established only by FS. */
export function admitManifestResponse(response: unknown): t.ManifestResponse {
  try {
    if (!isDataRecord(response)) return EXECUTION_FAILURE;
    // No checksum was requested. Unexpected byte-pin evidence is not content authority.
    if (ownData(response, 'checksum') !== undefined) return EXECUTION_FAILURE;
    const ok = ownData(response, 'ok');
    if (ok === true) {
      const data = ownData(response, 'data');
      const requestedUrl = ownData(response, 'requestedUrl');
      const finalUrl = ownData(response, 'finalUrl');
      if (
        !Is.object(data) || Is.Native.proxy(data) || !(data instanceof Blob) ||
        !Is.str(requestedUrl) || !Is.str(finalUrl)
      ) {
        return EXECUTION_FAILURE;
      }
      return Object.freeze({ ok: true, data, requestedUrl, finalUrl });
    }
    if (ok !== false) return EXECUTION_FAILURE;
    const status = ownData(response, 'status');
    if (!isHttpStatus(status)) return EXECUTION_FAILURE;
    const policyFailure = observePolicyFailure(ownData(response, 'error'));
    if (!policyFailure.ok) return EXECUTION_FAILURE;
    return Object.freeze({
      ok: false,
      reason: fetchReason({ status, policyFailure: policyFailure.value }),
    });
  } catch {
    return EXECUTION_FAILURE;
  }
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
): t.Dist.FailureReason {
  if (isRootedFailure(cause)) {
    if (cause.kind === 'cancelled') return 'cancelled';
    if (cause.kind === 'unsupported') return 'unsupported';
    return 'filesystem-failure';
  }
  return 'execution-failure';
}

/** Classify one safely captured bounded manifest Fetch failure. */
function fetchReason(response: FetchFailureObservation): t.Dist.FailureReason {
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

/** Classify one byte-checksummed Pull failure. */
export function pullReason(result: t.HttpPull.ResultFailure): t.Dist.FailureReason {
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
      return 'checksum-mismatch';
    case 'target-admission':
    case 'publication-failure':
      return 'filesystem-failure';
    default:
      return 'resource-failure';
  }
}

/** Classify one pinned verification or manifest-admission failure. */
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
    case 'pin-mismatch':
      return 'pin-mismatch';
    case 'malformed':
      return 'malformed-manifest';
    default:
      return 'verification-failure';
  }
}
