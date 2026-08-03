import { Fs, type t } from '../../../-test.ts';
import { Hash } from '../../common.ts';

const encoder = new TextEncoder();
const roots = new Set<t.StringAbsoluteDir>();

/** Create one finite checksum-pinned operation policy. */
export function resourcePolicy(
  resources: readonly t.HttpPull.Resource[],
  input: Partial<Omit<t.HttpPull.ResourcePolicy, 'response'>> & {
    readonly response?: Partial<t.HttpFetch.ResponsePolicy>;
  } = {},
): t.HttpPull.ResourcePolicy {
  return {
    response: responsePolicy(
      resources.map((resource) => resource.source),
      input.response,
    ),
    maxResources: input.maxResources ?? Math.max(1, resources.length),
    concurrency: input.concurrency ?? 2,
    maxAttempts: input.maxAttempts ?? 1,
    retryDelay: input.retryDelay ?? 0,
    maxRetryElapsed: input.maxRetryElapsed ?? 1000,
    maxTotalBytes: input.maxTotalBytes ?? 1024 * 1024,
    totalTimeout: input.totalTimeout ?? 2000,
  };
}

export function resource(
  source: t.StringUrl,
  target: t.StringRelativePath,
  content: string | Uint8Array,
  expectedBytes?: t.NumberBytes,
): t.HttpPull.Resource {
  const value = bytes(content);
  const expected = arguments.length < 4 ? value.byteLength : expectedBytes;
  return {
    source,
    target,
    checksum: Hash.sha256(value),
    ...(expected === undefined ? {} : { expectedBytes: expected }),
  };
}

export async function rooted(prefix = 'http-pull-rooted-'): Promise<t.Fs.Rooted.Instance> {
  const dir = await Fs.makeTempDir({ prefix });
  const root = await Fs.realPath(dir.absolute);
  roots.add(root);
  return await Fs.Capability.Rooted.create({ root });
}

export async function cleanupRoots(): Promise<void> {
  const paths = [...roots];
  roots.clear();
  await Promise.all(paths.map((path) => Fs.remove(path, { recursive: true })));
}

export function localhost(input: t.StringUrl): t.StringUrl {
  const url = new URL(input);
  if (url.hostname === '0.0.0.0') url.hostname = '127.0.0.1';
  return url.href;
}

export function rootedFailure(
  operation: t.Fs.Rooted.Operation,
  kind: t.Fs.Rooted.FailureKind,
  message: string,
  committed = false,
): t.Fs.Rooted.Failure {
  const error = new Error(message) as t.Fs.Rooted.Failure;
  Object.defineProperties(error, {
    name: { value: 'FsRootedError' },
    operation: { value: operation },
    kind: { value: kind },
    committed: { value: committed },
  });
  return error;
}

export function responsePolicy(
  sources: readonly t.StringUrl[],
  input: Partial<t.HttpFetch.ResponsePolicy> = {},
): t.HttpFetch.ResponsePolicy {
  const parsed = sources.flatMap((url) => {
    try {
      return [new URL(url).origin];
    } catch {
      return [];
    }
  });
  const sourceOrigins = [...new Set(parsed)];
  if (sourceOrigins.length === 0) sourceOrigins.push('https://example.test');
  return {
    maxBytes: input.maxBytes ?? 1024 * 1024,
    timeout: input.timeout ?? 1000,
    maxRedirects: input.maxRedirects ?? 2,
    progressInterval: input.progressInterval ?? 25,
    sourceOrigins: input.sourceOrigins ?? sourceOrigins,
    credentialOrigins: input.credentialOrigins ?? [],
  };
}

function bytes(input: string | Uint8Array): Uint8Array {
  return typeof input === 'string' ? encoder.encode(input) : input;
}
