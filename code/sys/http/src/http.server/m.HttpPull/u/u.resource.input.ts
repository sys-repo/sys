import {
  Arr,
  fetchDefaultHeaders,
  Is,
  Num,
  Obj,
  type t,
  validateResponsePolicy,
} from '../common.ts';
import { failureRecord, RESOURCE_FAILURE, type ResourceFailure } from './u.resource.failure.ts';
import { type ResourceSnapshot, snapshotResources } from './u.resource.snapshot.ts';

export type PolicySnapshot = t.HttpPull.ResourcePolicy & {
  readonly sourceOrigins: ReadonlySet<string>;
};

export type PreparedStart = {
  readonly ok: true;
  readonly resources: readonly ResourceSnapshot[];
  readonly rooted: t.Fs.Rooted.Instance;
  readonly policy: PolicySnapshot;
  readonly headers?: t.HttpFetch.Mutate.Headers;
  readonly until?: t.UntilInput;
  readonly resourceCount: number;
};

export type RejectedStart = {
  readonly ok: false;
  readonly resources: readonly ResourceSnapshot[];
  readonly records: readonly t.HttpPull.ResourceRecordFailure[];
  readonly failure: ResourceFailure;
  readonly resourceCount: number;
};

export type Preparation = PreparedStart | RejectedStart;

const MAX_TRANSFER_CHUNK_BYTES = 4_294_967_295;
const START_KEYS = ['resources', 'rooted', 'policy', 'credentials', 'until'] as const;
const POLICY_KEYS = [
  'response',
  'maxResources',
  'concurrency',
  'maxAttempts',
  'retryDelay',
  'maxRetryElapsed',
  'maxTotalBytes',
  'totalTimeout',
] as const;
const CREDENTIAL_KEYS = ['accessToken', 'headers'] as const;

/** Snapshot and validate every operation authority before asynchronous work begins. */
export function prepareStart(input: unknown): Preparation {
  const snapshot = snapshotStartInput(input);
  if (!snapshot) return rejectStart([], RESOURCE_FAILURE.input, 0);

  const policy = snapshotPolicy(snapshot.policy);
  if (!policy) {
    return rejectStart([], RESOURCE_FAILURE.policy, resourceCount(snapshot.resources));
  }
  if (!Arr.isArray(snapshot.resources)) return rejectStart([], RESOURCE_FAILURE.input, 0);

  let count = 0;
  try {
    count = snapshot.resources.length;
  } catch {
    return rejectStart([], RESOURCE_FAILURE.input, 0);
  }
  if (count > policy.maxResources) return rejectStart([], RESOURCE_FAILURE.resources, count);

  const resources = snapshotResources(snapshot.resources, {
    sourceOrigins: policy.sourceOrigins,
    maxFileBytes: policy.response.maxBytes,
    maxTotalBytes: policy.maxTotalBytes,
  });
  if (!resources.ok) {
    return {
      ok: false,
      resources: resources.resources,
      records: resources.records,
      failure: resources.failure,
      resourceCount: count,
    };
  }

  const rooted = snapshotRooted(snapshot.rooted);
  if (!rooted) return rejectStart(resources.resources, RESOURCE_FAILURE.input, count);

  const credentials = snapshotCredentials(snapshot.credentials);
  if (!credentials.ok) {
    return rejectStart(resources.resources, RESOURCE_FAILURE.input, count);
  }

  return {
    ok: true,
    resources: resources.resources,
    rooted,
    policy,
    headers: credentials.headers,
    until: snapshot.until as t.UntilInput | undefined,
    resourceCount: count,
  };
}

/** Replace a preparation with stable rejected evidence. */
export function rejectStart(
  resources: readonly ResourceSnapshot[],
  failure: ResourceFailure,
  count: number,
): RejectedStart {
  return {
    ok: false,
    resources,
    records: Object.freeze(resources.map((resource) => failureRecord(resource, failure))),
    failure,
    resourceCount: count,
  };
}

function snapshotStartInput(input: unknown): {
  readonly resources: unknown;
  readonly rooted: unknown;
  readonly policy: unknown;
  readonly credentials: unknown;
  readonly until: unknown;
} | undefined {
  try {
    if (!Is.record(input)) return;
    if (Obj.keys(input).some((key) => !START_KEYS.includes(key as typeof START_KEYS[number]))) {
      return;
    }
    if (
      !Obj.hasOwn(input, 'resources') ||
      !Obj.hasOwn(input, 'rooted') ||
      !Obj.hasOwn(input, 'policy')
    ) {
      return;
    }
    const until = Obj.hasOwn(input, 'until') ? input.until : undefined;
    if (!Is.untilInput(until)) return;
    return Object.freeze({
      resources: input.resources,
      rooted: input.rooted,
      policy: input.policy,
      credentials: Obj.hasOwn(input, 'credentials') ? input.credentials : undefined,
      until,
    });
  } catch {
    return;
  }
}

function snapshotPolicy(input: unknown): PolicySnapshot | undefined {
  try {
    if (!Is.record(input)) return;
    if (!POLICY_KEYS.every((key) => Obj.hasOwn(input, key))) return;
    if (Obj.keys(input).some((key) => !POLICY_KEYS.includes(key as typeof POLICY_KEYS[number]))) {
      return;
    }

    const response = validateResponsePolicy(input.response);
    if (!response.ok) return;

    const maxResources = input.maxResources;
    const concurrency = input.concurrency;
    const maxAttempts = input.maxAttempts;
    const retryDelay = input.retryDelay;
    const maxRetryElapsed = input.maxRetryElapsed;
    const maxTotalBytes = input.maxTotalBytes;
    const totalTimeout = input.totalTimeout;
    if (!isSafeInt(maxResources, 0)) return;
    if (!isSafeInt(concurrency, 1)) return;
    if (!isSafeInt(maxAttempts, 1)) return;
    if (!isSafeInt(retryDelay, 0)) return;
    if (!isSafeInt(maxRetryElapsed, 0)) return;
    if (!isSafeInt(maxTotalBytes, 0)) return;
    if (!isSafeInt(totalTimeout, 1)) return;
    if (maxResources > 0 && maxAttempts > Math.floor(Num.MAX_INT / maxResources)) return;
    const maxInFlight = Math.min(maxResources, concurrency);
    const chunkHeadroom = Math.floor((Num.MAX_INT - maxTotalBytes) / MAX_TRANSFER_CHUNK_BYTES);
    if (maxInFlight > chunkHeadroom) return;

    const sourceOrigins = new Set(response.value.sourceOrigins);
    const credentialOrigins = new Set(response.value.credentialOrigins);
    const responseSnapshot: t.HttpFetch.ResponsePolicy = Object.freeze({
      maxBytes: response.value.maxBytes,
      timeout: response.value.timeout,
      maxRedirects: response.value.maxRedirects,
      progressInterval: response.value.progressInterval,
      sourceOrigins: Object.freeze([...sourceOrigins]),
      credentialOrigins: Object.freeze([...credentialOrigins]),
    });
    return Object.freeze({
      response: responseSnapshot,
      maxResources,
      concurrency,
      maxAttempts,
      retryDelay,
      maxRetryElapsed,
      maxTotalBytes,
      totalTimeout,
      sourceOrigins,
    });
  } catch {
    return;
  }
}

function snapshotCredentials(input: unknown):
  | { readonly ok: true; readonly headers?: t.HttpFetch.Mutate.Headers }
  | { readonly ok: false } {
  if (input === undefined) return { ok: true };
  try {
    if (!Is.record(input)) return { ok: false };
    if (
      Obj.keys(input).some((key) =>
        !CREDENTIAL_KEYS.includes(key as typeof CREDENTIAL_KEYS[number])
      )
    ) {
      return { ok: false };
    }

    const accessToken = Obj.hasOwn(input, 'accessToken') ? input.accessToken : undefined;
    const mutate = Obj.hasOwn(input, 'headers') ? input.headers : undefined;
    if (accessToken !== undefined && !Is.str(accessToken) && !Is.func(accessToken)) {
      return { ok: false };
    }
    if (mutate !== undefined && !Is.func(mutate)) return { ok: false };

    let output: unknown;
    const headers = fetchDefaultHeaders({
      accessToken: accessToken as t.HttpFetch.CreateOptions['accessToken'],
      headers: mutate
        ? (event) => {
          output = mutate(event);
        }
        : undefined,
    });
    if (Is.promise(output)) {
      Promise.resolve(output).catch(() => undefined);
      return { ok: false };
    }

    const entries: Array<readonly [string, string]> = [];
    headers.forEach((value, name) => entries.push(Object.freeze([name, value])));
    if (entries.length === 0) return { ok: true };
    const frozen = Object.freeze(entries);
    return {
      ok: true,
      headers: ({ set }) => {
        frozen.forEach(([name, value]) => set(name, value));
      },
    };
  } catch {
    return { ok: false };
  }
}

function resourceCount(input: unknown): number {
  try {
    return Arr.isArray(input) && Num.Is.safeInt(input.length) ? input.length : 0;
  } catch {
    return 0;
  }
}

function snapshotRooted(input: unknown): t.Fs.Rooted.Instance | undefined {
  try {
    if (!Is.record(input)) return;
    const path = input.path;
    const admit = input.admit;
    const publishFile = input.publishFile;
    const createStage = input.createStage;
    const discardStage = input.discardStage;
    const promoteStage = input.promoteStage;
    if (!Is.str(path)) return;
    if (
      !Is.func(admit) ||
      !Is.func(publishFile) ||
      !Is.func(createStage) ||
      !Is.func(discardStage) ||
      !Is.func(promoteStage)
    ) {
      return;
    }
    return Object.freeze({
      path,
      admit,
      publishFile,
      createStage,
      discardStage,
      promoteStage,
    }) as t.Fs.Rooted.Instance;
  } catch {
    return;
  }
}

function isSafeInt(input: unknown, minimum: number): input is number {
  return Num.Is.safeInt(input) && input >= minimum;
}
