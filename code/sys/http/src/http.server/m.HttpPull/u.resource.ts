import { Arr, Fs, Is, Num, Obj, Pkg, type t, Url } from './common.ts';
import { fetchBytesOnce } from './u.fetch.ts';

const FAILURE = {
  resource: 'Invalid secure pull resource',
  source: 'Invalid secure pull source',
  checksum: 'Invalid secure pull checksum',
  size: 'Invalid secure pull expected byte size',
  admission: 'Secure pull target admission failed',
  request: 'Secure pull request failed',
  checksumMismatch: 'Fetched resource checksum does not match expected checksum',
  sizeMismatch: 'Fetched resource byte size does not match expected bytes',
  publication: 'Secure pull publication failed',
} as const;

type SourceSnapshot = {
  readonly input: t.StringUrl;
  readonly href: t.StringUrl;
};

type ResourceSnapshot = {
  readonly source: SourceSnapshot;
  readonly target: { readonly input: t.StringRelativePath };
  readonly checksum: t.StringHash;
  readonly expectedBytes?: t.NumberBytes;
};

type PreparedResource = {
  readonly source: SourceSnapshot;
  readonly target: {
    readonly input: t.StringRelativePath;
    readonly path: t.StringRelativePath;
    readonly handle: Parameters<t.Fs.Rooted.Instance['publishFile']>[0];
  };
  readonly checksum: t.StringHash;
  readonly expectedBytes?: t.NumberBytes;
};

type ResourcePreflight =
  | { readonly ok: true; readonly resources: readonly PreparedResource[] }
  | { readonly ok: false; readonly records: readonly t.HttpPull.RecordFailure[] };

/** Validate and snapshot a complete resource batch before admitting every target together. */
export async function preflightResources(
  input: readonly t.HttpPull.Resource[],
  rooted: t.Fs.Rooted.Instance,
  until?: t.UntilInput,
): Promise<ResourcePreflight> {
  const snapshot = snapshotResources(input);
  if (!snapshot.ok) return snapshot;

  try {
    const admission = await rooted.admit(
      snapshot.resources.map((resource) => ({
        kind: 'file' as const,
        path: resource.target.input,
      })),
      { until },
    );
    if (!Arr.isArray(admission.targets) || admission.targets.length !== snapshot.resources.length) {
      return failure(snapshot.resources, FAILURE.admission);
    }

    const resources: PreparedResource[] = [];
    for (let index = 0; index < snapshot.resources.length; index++) {
      const resource = snapshot.resources[index];
      const handle = admission.targets[index];
      if (!Is.object(handle) || handle.kind !== 'file' || !Is.str(handle.path)) {
        return failure(snapshot.resources, FAILURE.admission);
      }
      resources.push(Object.freeze({
        ...resource,
        target: Object.freeze({ input: resource.target.input, path: handle.path, handle }),
      }));
    }
    return { ok: true, resources: Object.freeze(resources) };
  } catch (cause) {
    if (Fs.Capability.Rooted.Is.failure(cause)) {
      return failure(snapshot.resources, FAILURE.admission, filesystemEvidence(cause));
    }
    return failure(snapshot.resources, FAILURE.admission);
  }
}

/** Fetch, authenticate, and immutably publish one admitted resource. */
export async function pullResource(
  resource: PreparedResource,
  rooted: t.Fs.Rooted.Instance,
  client: t.HttpFetch.Instance,
  options: { readonly signal?: AbortSignal },
): Promise<t.HttpPull.Record> {
  const path = { source: resource.source.input, target: resource.target.path };
  const fetched = await fetchBytesOnce(new URL(resource.source.href), client, {
    checksum: resource.checksum,
    signal: options.signal,
  });

  if (!fetched.ok) {
    const checksumMismatch = fetched.checksum?.valid === false;
    return {
      ok: false,
      status: fetched.status,
      error: checksumMismatch ? FAILURE.checksumMismatch : FAILURE.request,
      path,
    };
  }

  const checksum = fetched.checksum;
  if (
    !checksum?.valid ||
    checksum.expected !== resource.checksum ||
    checksum.actual !== resource.checksum
  ) {
    return { ok: false, status: 412, error: FAILURE.checksumMismatch, path };
  }

  if (
    resource.expectedBytes !== undefined &&
    fetched.bytes.byteLength !== resource.expectedBytes
  ) {
    return { ok: false, status: 412, error: FAILURE.sizeMismatch, path };
  }

  try {
    const published = await rooted.publishFile(resource.target.handle, fetched.bytes, {
      until: options.signal,
    });
    return {
      ok: true,
      status: fetched.status,
      bytes: published.bytes,
      path,
    };
  } catch (cause) {
    if (Fs.Capability.Rooted.Is.failure(cause)) {
      return {
        ok: false,
        error: FAILURE.publication,
        filesystem: filesystemEvidence(cause),
        path,
      };
    }
    return { ok: false, error: FAILURE.publication, path };
  }
}

type SnapshotResult =
  | { readonly ok: true; readonly resources: readonly ResourceSnapshot[] }
  | { readonly ok: false; readonly records: readonly t.HttpPull.RecordFailure[] };

function snapshotResources(input: unknown): SnapshotResult {
  if (!Arr.isArray(input)) return failure([], FAILURE.resource);

  const resources: ResourceSnapshot[] = [];
  let error: string | undefined;
  let length = 0;
  try {
    length = input.length;
  } catch {
    return failure([], FAILURE.resource);
  }

  for (let index = 0; index < length; index++) {
    let source = '';
    let sourceHref = '';
    let target = '';
    let checksum = '';
    let expectedBytes: unknown;

    try {
      const value = input[index];
      if (!Is.record(value)) {
        error ??= FAILURE.resource;
      } else {
        const sourceValue = Obj.hasOwn(value, 'source') ? value.source : undefined;
        const targetValue = Obj.hasOwn(value, 'target') ? value.target : undefined;
        const checksumValue = Obj.hasOwn(value, 'checksum') ? value.checksum : undefined;
        const sizeValue = Obj.hasOwn(value, 'expectedBytes') ? value.expectedBytes : undefined;
        if (sourceValue === undefined || targetValue === undefined || checksumValue === undefined) {
          error ??= FAILURE.resource;
        }

        source = Is.str(sourceValue) ? sourceValue : '';
        target = Is.str(targetValue) ? targetValue : '';
        checksum = Is.str(checksumValue) ? checksumValue : '';
        expectedBytes = sizeValue;
      }
    } catch {
      error ??= FAILURE.resource;
    }

    const parsedSource = parseSource(source);
    if (!parsedSource) error ??= FAILURE.source;
    else sourceHref = parsedSource.href;

    const parsedChecksum = Pkg.Dist.Part.parse(checksum);
    if (!parsedChecksum || parsedChecksum.hash !== checksum || parsedChecksum.size !== undefined) {
      error ??= FAILURE.checksum;
    }

    if (
      expectedBytes !== undefined &&
      (!Num.Is.safeInt(expectedBytes) || expectedBytes < 0)
    ) {
      error ??= FAILURE.size;
    }

    resources.push(Object.freeze({
      source: Object.freeze({ input: source, href: sourceHref }),
      target: Object.freeze({ input: target }),
      checksum,
      ...(expectedBytes === undefined ? {} : { expectedBytes: expectedBytes as t.NumberBytes }),
    }));
  }

  return error ? failure(resources, error) : { ok: true, resources: Object.freeze(resources) };
}

function parseSource(input: string): URL | undefined {
  if (!input || input !== input.trim()) return;
  try {
    const url = new URL(input);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password
    ) {
      return;
    }
    url.hash = '';
    return url;
  } catch {
    return;
  }
}

function failure(
  resources: readonly Pick<ResourceSnapshot, 'source'>[],
  error: string,
  filesystem?: t.HttpPull.RootedFailureEvidence,
): { readonly ok: false; readonly records: readonly t.HttpPull.RecordFailure[] } {
  const records = resources.map(({ source }) =>
    Object.freeze({
      ok: false as const,
      error,
      ...(filesystem ? { filesystem } : {}),
      path: Object.freeze({ source: safeSource(source.href), target: '' }),
    })
  );
  return { ok: false, records: Object.freeze(records) };
}

function filesystemEvidence(failure: t.Fs.Rooted.Failure): t.HttpPull.RootedFailureEvidence {
  return Object.freeze({
    operation: failure.operation,
    kind: failure.kind,
    committed: failure.committed,
  });
}

function safeSource(input: t.StringUrl): t.StringUrl {
  const canonical = Url.toCanonical(input);
  return canonical.ok ? canonical.href : '';
}
