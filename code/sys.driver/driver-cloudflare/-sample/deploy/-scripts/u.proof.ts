import { Fetch } from '@sys/http/client';
import { HttpServer } from '@sys/http/server';
import { main } from '../src/entry.ts';
import { readData } from '../src/m.app/u.data.ts';
import { artifactFrom, configFrom, DIST_LIMITS } from '../src/m.app/u.selection.ts';
import { Arr, Env, Fs, Hash, Is, Json, MediaType, Obj, Pkg, ROOT } from './common.ts';

const ORIGIN = 'http://127.0.0.1:8080';

/** Select one local build and retain its verified expectations before any live work. */
export async function prepareProof(root = ROOT) {
  const data = (name: string) => readData(Fs.Path.toFileUrl(Fs.join(root, name)));
  const config = configFrom(await data('config.json'));
  const artifact = artifactFrom(await data('artifact.json'));
  const { integrity } = artifact;
  const dir = Fs.join(root, 'dist');
  const verify = () => Pkg.Dist.Pinned.verify({ dir, integrity, limits: DIST_LIMITS });
  const before = await verify();
  require(before.kind === 'verified', `Local Dist refused: ${before.kind}.`);
  require(
    Arr.equal(
      [...Obj.keys(before.evidence.dist.hash.parts), 'dist.json'].sort(),
      [...artifact.files].sort(),
    ),
    'Artifact filename selection differs from the verified Dist.',
  );

  const expected = new Map<string, Uint8Array>();
  for (const path of artifact.files) {
    const snapshot = await Fs.Snapshot.file({
      root: dir,
      path: Fs.join(dir, path),
      maxBytes: path === 'dist.json' ? DIST_LIMITS.manifestBytes : DIST_LIMITS.fileBytes,
      timeout: 5_000,
    });
    const checksum = path === 'dist.json'
      ? integrity
      : Pkg.Dist.Part.hash(before.evidence.dist.hash.parts[path]);
    require(
      Hash.sha256(snapshot.bytes) === checksum,
      'Local Dist changed during expectation capture.',
    );
    expected.set(path, snapshot.bytes);
  }
  require((await verify()).kind === 'verified', 'Local Dist changed during expectation capture.');
  return { config, artifact, expected, verify };
}

/** Read-only proof of the selected local build. Never builds, uploads, or retries. */
export async function prove() {
  const { config, artifact, expected, verify } = await prepareProof();
  const target = { accountId: config.accountId, bucket: config.bucket, prefix: config.prefix };
  console.info(Json.stringify({
    result: 'selected',
    integrity: artifact.integrity,
    target,
    files: artifact.files,
    maxRequests: 2 * expected.size + 6,
    maxStorageReads: 2 * expected.size + 1,
  }));

  const env = await Env.load({ cwd: ROOT, search: 'upward' });
  const app = await main({ targetDir: '.' }, env);
  const server = HttpServer.start(app, {
    hostname: '127.0.0.1',
    port: 8080,
    strictPort: true,
    keyboard: false,
    silent: true,
  });
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
    for (const [path, bytes] of expected) {
      const url = `${ORIGIN}/ui/${path}`;
      requests++;
      const get = await client.blob(url, {}, { checksum: Hash.sha256(bytes) });
      if (!get.ok) {
        console.info(Json.stringify({
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
      console.info(
        Json.stringify({ path, bytes: bytes.length, sha256: Hash.sha256(received), mime }),
      );
    }
    requests++;
    const index = await client.blob(`${ORIGIN}/ui/`);
    require(index.ok, `UI index failed: HTTP ${index.status}.`);
    require(
      Hash.sha256(new Uint8Array(await index.data.arrayBuffer())) ===
        Hash.sha256(expected.get('index.html')),
      'UI index mismatch.',
    );
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
    requests++;
    const missing = await client.blob(`${ORIGIN}/ui/unselected-proof-file.txt`);
    require(missing.status === 404, 'Unselected path did not return 404.');
    headers(missing.headers);
    require((await verify()).kind === 'verified', 'Local Dist changed during live proof.');
    console.info(Json.stringify({
      result: 'verified',
      integrity: artifact.integrity,
      target,
      requests,
      files: expected.size,
      api: '👋 hello world!',
      browser: 'not exercised',
      bucketPrivacy: 'not attested',
    }));
  } finally {
    client.dispose();
    await server.close();
    await server.finished;
  }
}

function headers(value: Headers) {
  require(value.get('cache-control') === 'no-store', 'Missing no-store.');
  require(value.get('x-content-type-options') === 'nosniff', 'Missing nosniff.');
}

function require(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
