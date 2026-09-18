import { Fetch } from '@sys/http/client';
import { HttpServer } from '@sys/http/server';
import { appFrom } from '../src/entry.ts';
import { readInputs } from '../src/m.app/u.data.ts';
import { DIST_LIMITS } from '../src/m.app/u.selection.ts';
import { Arr, Env, Fs, Hash, Is, Json, MediaType, Pkg, ROOT, type t } from './common.ts';
import { selectBuild } from './u.selection.ts';

const ORIGIN = 'http://127.0.0.1:8080';

/** Select one local build and retain its verified expectations before any live work. */
export async function prepareProof(root = ROOT) {
  const inputs = await readInputs(root);
  const selected = await selectBuild(inputs.pin, root);
  require(selected.kind === 'verified', `Local Dist refused: ${selected.kind}.`);
  const { files, dir, evidence, verify } = selected;
  const integrity = inputs.pin['dist.json'];

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
  const { inputs, files, expected, verify } = await prepareProof(root);
  const { config, pin } = inputs;
  const integrity = pin['dist.json'];
  const target = { accountId: config.accountId, bucket: config.bucket, prefix: config.prefix };
  const maxRequests = 2 * expected.size + 6;
  const maxStorageReads = 2 * expected.size + 2;
  log(
    Json.stringify({ result: 'selected', integrity, target, files, maxRequests, maxStorageReads }),
  );

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
  try {
    const env = options.env ?? await Env.load({ cwd: root, search: 'upward' });
    bootstrapAttempts++;
    const app = await appFrom(inputs, env);
    server = start(app);
    for (const [path, bytes] of expected) {
      const url = `${ORIGIN}/ui/${path}`;
      requests++;
      const get = await client.blob(url, {}, { checksum: Hash.sha256(bytes) });
      if (!get.ok) {
        log(Json.stringify({
          result: 'refused',
          path,
          requests,
          status: get.status,
          checksum: get.checksum,
        }));
      }
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
      log(Json.stringify({ path, bytes: bytes.length, sha256: Hash.sha256(received), mime }));
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
    log(Json.stringify({
      result: 'verified',
      integrity,
      target,
      requests,
      bootstrapAttempts,
      maxStorageReads,
      files: expected.size,
      api: '👋 hello world!',
      browser: 'not exercised',
      bucketPrivacy: 'not attested',
    }));
  } catch (error) {
    log(Json.stringify({
      result: 'refused',
      integrity,
      target,
      requests,
      bootstrapAttempts,
      maxStorageReads,
    }));
    throw error;
  } finally {
    client.dispose();
    if (server) {
      await server.close();
      await server.finished;
    }
  }
}

function headers(value: Headers) {
  require(value.get('cache-control') === 'no-store', 'Missing no-store.');
  require(value.get('x-content-type-options') === 'nosniff', 'Missing nosniff.');
}

function require(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
