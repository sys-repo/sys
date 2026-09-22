import { Fetch } from '@sys/http/client';
import { HttpServer } from '@sys/http/server';
import { appFrom } from '../src/entry.ts';
import { readInputs } from '../src/m.app/u.data.ts';
import { DIST_LIMITS } from '../src/m.app/u.selection.ts';
import { Arr, Env, Fs, Hash, Is, Json, MediaType, Pkg, ROOT, type t } from './common.ts';
import { selectBuild } from './u.selection.ts';

type RefusedGet =
  & { readonly path: string }
  & Pick<t.HttpFetch.ResponseFailure, 'status' | 'checksum'>;

const ORIGIN = 'http://127.0.0.1:8080';

/** Select one local build and retain its verified expectations before any live work. */
export async function prepareProof(root = ROOT) {
  const inputs = await readInputs(root);
  const selected = await selectBuild(inputs.selection.private, root);
  require(selected.kind === 'verified', `Local Dist refused: ${selected.kind}.`);
  const { files, dir, evidence, verify } = selected;
  const integrity = inputs.selection.private['dist.json'];

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

/** Read-only proof of the selected local build. Never builds, uploads, or retries. */
export async function prove(options: t.ProofOptions = {}) {
  const root = options.root ?? ROOT;
  const log = options.log ?? console.info;
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
  const { config, selection } = inputs;
  const integrity = selection.private['dist.json'];
  const target = { accountId: config.accountId, ...config.targets.private };
  const maxRequests = 2 * expected.size + 6;
  const maxStorageReads = 2 * expected.size + 2;
  // Finish the announcement before credentials, storage, or listener ownership is acquired.
  await report({
    result: 'selected',
    scope: 'private-shell',
    integrity,
    target,
    files,
    maxRequests,
    maxStorageReads,
  });

  const start = options.start ?? ((app: t.HttpServer.App) => {
    return HttpServer.start(app, {
      hostname: '127.0.0.1',
      port: 8080,
      strictPort: true,
      keyboard: false,
      silent: true,
    });
  });
  let server: Pick<t.HttpServer.Started, 'close' | 'finished'> | undefined;
  let finished: Promise<PromiseSettledResult<void>> | undefined;
  const failures: unknown[] = [];
  let bootstrapAttempts = 0;
  const client = Fetch.make({
    policy: {
      maxBytes: config.limits.maxBytes,
      timeout: 8_000,
      maxRedirects: 0,
      progressInterval: 100,
      sourceOrigins: [ORIGIN],
      credentialOrigins: [],
    },
  });
  let requests = 0;
  let refusedGet: RefusedGet | undefined;
  try {
    const env = options.env ?? await Env.load({ cwd: root, search: 'upward' });
    bootstrapAttempts++;
    const app = await appFrom(inputs, env);
    server = start(app);
    // Observe rejection immediately; retain the outcome for cleanup even if close later rejects.
    finished = server.finished.then(
      () => ({ status: 'fulfilled', value: undefined }),
      (reason) => ({ status: 'rejected', reason }),
    );
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
      require(head.ok, `HEAD ${path} failed: HTTP ${head.status}.`);
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
    require(index.ok, `UI index failed: HTTP ${index.status}.`);
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
    require(apiHead.ok, `API HEAD failed: HTTP ${apiHead.status}.`);
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
    // Keep the negative probe outside the admitted inventory and storage-read ceiling.
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
    failures.push(error);
    // Do not report a broken reporter back through itself or lose an earlier proof failure.
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
        failures.push(reportError);
      }
    }
  } finally {
    try {
      client.dispose();
    } catch (error) {
      failures.push(error);
    }
    if (server) {
      try {
        await server.close();
      } catch (error) {
        failures.push(error);
      }
      const completion = await finished;
      if (completion?.status === 'rejected') failures.push(completion.reason);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Private proof encountered multiple failures.', {
      cause: failures[0],
    });
  }
}

function headers(value: Headers) {
  require(value.get('cache-control') === 'no-store', 'Missing no-store.');
  require(value.get('x-content-type-options') === 'nosniff', 'Missing nosniff.');
}

function require(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
