import { Err, Is, type t, toHeaders } from '../common.ts';

const NOMINAL = new WeakSet<object>();

const FAILURE = {
  'invalid-policy': { status: 400, statusText: 'Invalid bounded fetch policy' },
  'invalid-request': { status: 400, statusText: 'Invalid bounded fetch request' },
  'invalid-url': { status: 400, statusText: 'Invalid bounded fetch URL' },
  'source-denied': { status: 403, statusText: 'Fetch source origin denied' },
  'redirect-invalid': { status: 400, statusText: 'Invalid fetch redirect' },
  'redirect-downgrade': { status: 403, statusText: 'Fetch redirect downgrade denied' },
  'redirect-loop': { status: 508, statusText: 'Fetch redirect loop detected' },
  'redirect-limit': { status: 508, statusText: 'Fetch redirect limit exceeded' },
  'response-timeout': { status: 408, statusText: 'Fetch response timeout exceeded' },
  'response-too-large': { status: 413, statusText: 'Fetch response byte limit exceeded' },
  'progress-failure': { status: 500, statusText: 'Fetch progress callback failed' },
} as const satisfies Record<
  t.HttpFetch.ResponsePolicy.FailureKind,
  { readonly status: t.HttpStatusCode; readonly statusText: string }
>;

export type FailureKind = t.HttpFetch.ResponsePolicy.FailureKind;

export type NominalFailure = Error & {
  readonly policyFailure: FailureKind;
};

type FailureResponseArgs = {
  readonly method: string;
  readonly safeUrl: t.StringUrl;
  readonly status: t.HttpStatusCode;
  readonly statusText: string;
  readonly headers: Headers;
  readonly cause: t.StdError;
  readonly checksum?: t.HttpFetch.ResponseChecksum;
  readonly policyFailure?: FailureKind;
};

/** Create one private owner-authenticated policy failure. */
export function policyFailure(kind: FailureKind): NominalFailure {
  const error = new Error(FAILURE[kind].statusText) as NominalFailure;
  Object.defineProperty(error, 'policyFailure', { value: kind });
  NOMINAL.add(error);
  return error;
}

/** Test private owner identity rather than public error shape. */
export function isPolicyFailure(input: unknown): input is NominalFailure {
  return Is.object(input) && NOMINAL.has(input);
}

/** Build a stable public policy-failure response. */
export function policyFailureResponse(
  method: string,
  safeUrl: t.StringUrl,
  kind: FailureKind,
): t.HttpFetch.ResponseFailure {
  const { status, statusText } = FAILURE[kind];
  const message = `${status}: ${statusText}`;
  return failureResponse({
    method,
    safeUrl,
    status,
    statusText,
    headers: new Headers(),
    cause: Err.std(message, { name: 'HttpPolicyError' }),
    policyFailure: kind,
  });
}

/** Build one canonical failed Fetch response. */
export function failureResponse(args: FailureResponseArgs): t.HttpFetch.ResponseFailure {
  const base = Err.std(`HTTP/${args.method} request failed: ${args.safeUrl}`, {
    name: 'HttpError',
    cause: args.cause,
  });
  const error: t.HttpFetch.Error = {
    ...base,
    status: args.status,
    statusText: args.statusText,
    headers: toHeaders(args.headers),
    ...(args.policyFailure ? { policyFailure: args.policyFailure } : {}),
  };
  if (args.policyFailure) markPolicyFailure(error, args.policyFailure);

  return {
    ok: false,
    status: args.status,
    statusText: args.statusText,
    url: args.safeUrl,
    headers: args.headers,
    data: undefined,
    error,
    checksum: args.checksum,
  };
}

function markPolicyFailure(error: t.HttpFetch.Error, kind: FailureKind): void {
  Object.defineProperty(error, 'policyFailure', { value: kind, enumerable: true });
}
