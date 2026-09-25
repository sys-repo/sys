import { Fetch } from '@sys/http/client';
import { HttpServer } from '@sys/http/server';
import {
  appFrom,
  DIST_LIMITS,
  READ_LIMITS,
  readInputs,
  selectBuild,
} from '../src/m.deployment/mod.ts';
import { Arr, Env, Fs, Hash, Is, Json, MediaType, Pkg, ROOT, type t } from './common.ts';
import { runTask } from './u.task.ts';

type RefusedGet =
  & { readonly path: string }
  & Pick<t.HttpFetch.ResponseFailure, 'status' | 'checksum'>;

const ORIGIN = 'http://127.0.0.1:8080';

/** Verify and snapshot the local private files for comparison with HTTP responses. */
export async function prepareProof(root = ROOT) {
  const inputs = await readInputs(root);
  const selected = await selectBuild(inputs.buildRecord.selection.pins.private, root);
  require(selected.kind === 'verified', `Local Dist refused: ${selected.kind}.`);
  const { files, dir, evidence, verify } = selected;
  const integrity = inputs.buildRecord.selection.pins.private['dist.json'];

  const expected = new Map<string, Uint8Array>();
  for (const path of files) {
    const snapshot = await Fs.Snapshot.file({
      root: dir,
      path: Fs.join(dir, path),
      maxBytes: path === 'dist.json' ? DIST_LIMITS.manifestBytes : DIST_LIMITS.fileBytes,
      timeout: 5_000,
    });
    const checksum = path === 'dist.json'
      ? integrity
      : Pkg.Dist.Part.hash(evidence.dist.hash.parts[path]);
    require(
      Hash.sha256(snapshot.bytes) === checksum,
      'Local Dist changed during expectation capture.',
    );
    expected.set(path, snapshot.bytes);
  }
  const rechecked = await verify();
  require(rechecked.kind === 'verified', 'Local Dist changed during expectation capture.');
  return { inputs, files, expected, verify };
}

/**
 * Check live private HTTP responses against the selected local files.
 *
 * A `verified` receipt precedes cleanup; await the returned promise for owned disposal.
 * Fetch statuses may be client-assigned rather than received from a server.
 *
 * A lone failure preserves its thrown value. For delivery D, refusal reporting R,
 * client cleanup C, and server cleanup H, combined failures compose as
 * `SuppressedError(H, SuppressedError(C, SuppressedError(R, D)))`,
 * omitting stages that did not fail. Follow `.error` and `.suppressed`, not a flat
 * `.errors` list or primary `.cause`. The HTTP owner's compound error stays intact.
 */
export function prove(options: t.ProofOptions = {}) {
  return proveWith(Fetch.make, options);
}

/** Internal acquisition seam for partial-acquisition and disposal composition tests. */
export async function proveWith(makeClient: typeof Fetch.make, options: t.ProofOptions = {}) {
  const root = options.root ?? ROOT;
  const log = options.log ?? console.info;
  const start = options.start ?? ((app: t.HttpServer.App) => {
    return HttpServer.start(app, {
      hostname: '127.0.0.1',
      port: 8080,
      strictPort: true,
      keyboard: false,
      silent: true,
    });
  });
  const reader = options.env;
  const capturedEnv = reader ? { get: reader.get.bind(reader) } : undefined;
  let reportingFailed = false;
  async function report(event: unknown) {
    try {
      await log(Json.stringify(event));
    } catch (error) {
      reportingFailed = true;
      throw error;
    }
  }

  const { inputs, files, expected, verify } = await prepareProof(root);
  const { config, buildRecord } = inputs;
  const integrity = buildRecord.selection.pins.private['dist.json'];
  const target = { accountId: config.accountId, ...config.targets.private };
  const maxRequests = 2 * expected.size + 6;
  const maxStorageReads = 2 * expected.size + 2;
  // Wait for the announcement before reading credentials or contacting storage.
  await report({
    result: 'selected',
    scope: 'private-shell',
    integrity,
    target,
    files,
    maxRequests,
    maxStorageReads,
  });

  // Declaration order keeps client cleanup before server cleanup, including failed acquisition.
  await using servers = new AsyncDisposableStack();
  using clients = new DisposableStack();
  let bootstrapAttempts = 0;
  let requests = 0;
  let refusedGet: RefusedGet | undefined;
  try {
    const env = capturedEnv ?? await Env.load({ cwd: root, search: 'upward' });
    bootstrapAttempts++;
    const app = await appFrom(inputs, env);
    servers.use(start(app));
    const client = clients.use(makeClient({
      policy: {
        maxBytes: READ_LIMITS.maxBytes,
        timeout: 8_000,
        maxRedirects: 0,
        progressInterval: 100,
        sourceOrigins: [ORIGIN],
        credentialOrigins: [],
      },
    }));
    for (const [path, bytes] of expected) {
      const url = `${ORIGIN}/ui/${path}`;
      requests++;
      const get = await client.blob(url, {}, { checksum: Hash.sha256(bytes) });
      if (!get.ok) refusedGet = { path, status: get.status, checksum: get.checksum };
      require(get.ok, `GET ${path} refused: Fetch status ${get.status}.`);
      const received = new Uint8Array(await get.data.arrayBuffer());
      require(Arr.equal([...received], [...bytes]), `Byte mismatch: ${path}.`);
      headers(get.headers);
      require(
        get.headers.get('content-length') === String(bytes.length),
        `Length mismatch: ${path}.`,
      );
      require(!get.headers.has('content-encoding'), `Unexpected content encoding: ${path}.`);
      const mime = get.headers.get('content-type')?.split(';')[0];
      const expectedMime = MediaType.fromPath(path) ?? MediaType.Fallback.binary;
      require(mime === expectedMime, `MIME mismatch: ${path}.`);
      requests++;
      const head = await client.head(url);
      require(head.ok, `HEAD ${path} failed: Fetch status ${head.status}.`);
      headers(head.headers);
      for (const name of ['content-type', 'content-length', 'content-encoding']) {
        require(
          head.headers.get(name) === get.headers.get(name),
          `HEAD ${name} mismatch: ${path}.`,
        );
      }
      await report({ path, bytes: bytes.length, sha256: Hash.sha256(received), mime });
    }
    requests++;
    const index = await client.blob(`${ORIGIN}/ui/`);
    require(index.ok, `UI index failed: Fetch status ${index.status}.`);
    const indexBytes = new Uint8Array(await index.data.arrayBuffer());
    const indexHash = Hash.sha256(indexBytes);
    const expectedIndexHash = Hash.sha256(expected.get('index.html'));
    require(indexHash === expectedIndexHash, 'UI index mismatch.');
    requests++;
    const api = await client.json<unknown>(`${ORIGIN}/api/hello`);
    require(
      api.ok && Is.record(api.data) && api.data.msg === '👋 hello world!',
      'API reply mismatch.',
    );
    headers(api.headers);
    requests++;
    const apiHead = await client.head(`${ORIGIN}/api/hello`);
    require(apiHead.ok, `API HEAD failed: Fetch status ${apiHead.status}.`);
    headers(apiHead.headers);
    for (const path of ['/', '/ui']) {
      requests++;
      const res = await fetch(`${ORIGIN}${path}`, {
        redirect: 'manual',
        credentials: 'omit',
        signal: AbortSignal.timeout(8_000),
      });
      try {
        require(
          res.status === 308 && res.headers.get('location') === '/ui/',
          `Redirect mismatch: ${path}.`,
        );
        headers(res.headers);
      } finally {
        await res.body?.cancel();
      }
    }
    // Choose a path outside the manifest; a 404 must not require an R2 read.
    let missingPath = 'unselected-proof-file.txt';
    while (expected.has(missingPath)) missingPath = `_${missingPath}`;
    requests++;
    const missing = await client.blob(`${ORIGIN}/ui/${missingPath}`);
    require(missing.status === 404, 'Unselected path did not return 404.');
    headers(missing.headers);
    const rechecked = await verify();
    require(rechecked.kind === 'verified', 'Local Dist changed during live proof.');
    await report({
      result: 'verified',
      scope: 'private-shell',
      publicDelivery: 'not exercised',
      integrity,
      target,
      requests,
      bootstrapAttempts,
      maxStorageReads,
      files: expected.size,
      api: '👋 hello world!',
      browser: 'not exercised',
      bucketPrivacy: 'not attested',
    });
  } catch (error) {
    // If logging failed, preserve that error instead of calling the logger again.
    if (!reportingFailed) {
      try {
        await report({
          ...refusedGet,
          result: 'refused',
          integrity,
          target,
          requests,
          bootstrapAttempts,
          maxStorageReads,
        });
      } catch (reportError) {
        throw new SuppressedError(reportError, error);
      }
    }
    throw error;
  }
}

if (import.meta.main) Deno.exitCode = await runTask('proof:local', () => prove());

function headers(value: Headers) {
  require(value.get('cache-control') === 'no-store', 'Missing no-store.');
  require(value.get('x-content-type-options') === 'nosniff', 'Missing nosniff.');
}

function require(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
