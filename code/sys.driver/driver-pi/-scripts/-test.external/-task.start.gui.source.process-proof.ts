import { Err, Fs, Is, Json, Obj, Pkg, type t, Time } from '../m.start.gui.source/common.ts';
import { loadGuiDistSource } from '../m.start.gui.source/mod.ts';

const HOSTNAME = '127.0.0.1';
const PORT = 8080;
const ORIGIN = 'http://localhost:8080';
const MANIFEST_URL = `${ORIGIN}/dist.json`;
const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../..');
const DIST_DIR: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, 'dist');
const SOURCE_ARGS = [
  'run',
  '--no-prompt',
  '-P=source',
  './-scripts/task.start.gui.source.ts',
] as const;
const EXIT_TIMEOUT = 5_000;

await requirePreparedSource();
await proveOccupiedPortRefusal();
await proveLiveSource();
console.info('Driver Pi GUI Dist source process proof passed.');

type SourceProcess = Readonly<{
  child: Deno.ChildProcess;
  output: Promise<Deno.CommandOutput>;
}>;

async function requirePreparedSource(): Promise<void> {
  try {
    await loadGuiDistSource(DIST_DIR);
  } catch (cause) {
    throw new Error(
      'The explicit GUI Dist source process proof requires one prepared frozen dist/.',
      { cause },
    );
  }
}

async function proveOccupiedPortRefusal(): Promise<void> {
  const blocker = Deno.listen({ hostname: HOSTNAME, port: PORT });
  try {
    const source = spawnSource();
    const output = await exitWithin(source, 'occupied-port source');
    const stderr = decode(output.stderr);

    assert(!output.success, 'Expected occupied-port source failure.');
    assert(
      stderr.includes('AddrInUse') || stderr.includes('Address already in use'),
      'Expected visible occupied-port refusal.',
    );
    assert(!decode(output.stdout).includes(MANIFEST_URL), 'Unexpected fallback source listener.');
  } finally {
    blocker.close();
  }
}

async function proveLiveSource(): Promise<void> {
  const saved = await requireBytes(Fs.join(DIST_DIR, 'dist.json'));
  const parsed = Json.safeParse<unknown>(decode(saved));
  assert(parsed.ok && Pkg.Is.dist(parsed.data), 'Expected canonical source manifest.');
  const artifacts: Uint8Array[] = [saved];

  const source = spawnSource();
  let output: Deno.CommandOutput;
  try {
    const manifest = await waitForManifest();
    assert(manifest.url === MANIFEST_URL, 'Unexpected manifest response authority.');
    assert(!manifest.redirected, 'Unexpected manifest redirect.');
    assertBytes(new Uint8Array(await manifest.arrayBuffer()), saved, 'manifest');

    const manifestHead = await fetch(MANIFEST_URL, { method: 'HEAD', redirect: 'manual' });
    assert(manifestHead.status === 200, 'Expected manifest HEAD response.');
    assert(
      manifestHead.headers.get('content-length') === String(saved.byteLength),
      'Unexpected manifest HEAD length.',
    );
    assert(
      (await manifestHead.arrayBuffer()).byteLength === 0,
      'Expected empty manifest HEAD body.',
    );

    for (const [path] of Obj.entries(parsed.data.hash.parts)) {
      assert(Is.string(path), 'Expected string part path.');
      const route = `/${path.split('/').map(encodeURIComponent).join('/')}`;
      const expected = await requireBytes(Fs.join(DIST_DIR, path));
      artifacts.push(expected);
      const response = await fetch(`${ORIGIN}${route}`, { redirect: 'manual' });
      assert(response.status === 200, `Expected declared part response: ${route}`);
      assert(response.url === `${ORIGIN}${route}`, `Unexpected declared part authority: ${route}`);
      assert(!response.redirected, `Unexpected declared part redirect: ${route}`);
      assertBytes(new Uint8Array(await response.arrayBuffer()), expected, route);

      const head = await fetch(`${ORIGIN}${route}`, { method: 'HEAD', redirect: 'manual' });
      assert(head.status === 200, `Expected declared part HEAD response: ${route}`);
      assert(
        head.headers.get('content-length') === String(expected.byteLength),
        `Unexpected declared part HEAD length: ${route}`,
      );
      assert((await head.arrayBuffer()).byteLength === 0, `Expected empty HEAD body: ${route}`);
    }

    const refused = await fetch(`${ORIGIN}/`, { redirect: 'manual' });
    assert(refused.status === 404, 'Expected undeclared-route refusal.');
    assert((await refused.arrayBuffer()).byteLength === 0, 'Expected empty refusal body.');

    const alternateAuthority = await fetch(`http://${HOSTNAME}:${PORT}/dist.json`, {
      redirect: 'manual',
    });
    assert(alternateAuthority.status === 404, 'Expected alternate-authority refusal.');
    assert(
      (await alternateAuthority.arrayBuffer()).byteLength === 0,
      'Expected empty alternate-authority refusal body.',
    );

    const substrateRefusal = await malformedRawRequest();
    assertSubstrateRefusal(substrateRefusal, artifacts);
  } finally {
    output = await stopSource(source);
  }

  const stdout = decode(output.stdout);
  const stderr = decode(output.stderr);
  assert(stdout.includes(MANIFEST_URL), 'Expected exact source URL output.');
  assert(stdout.includes('quit      Ctrl+C'), 'Expected truthful non-terminal quit output.');
  assert(!stdout.includes('Ctrl+C or Q'), 'Unexpected terminal-only quit claim.');
  assert(!stderr.includes('PermissionDenied'), 'Unexpected source permission failure.');
  assert(!stderr.includes('NotCapable'), 'Unexpected source capability failure.');
  assert(!stderr.includes('Uncaught'), 'Unexpected source shutdown stack.');

  let rebound: Deno.Listener | undefined;
  try {
    rebound = Deno.listen({ hostname: HOSTNAME, port: PORT });
  } finally {
    rebound?.close();
  }
  assert(rebound !== undefined, 'Expected successful listener rebinding after shutdown.');
}

function spawnSource(): SourceProcess {
  const child = new Deno.Command(Deno.execPath(), {
    args: [...SOURCE_ARGS],
    cwd: PACKAGE_ROOT,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  return Object.freeze({ child, output: child.output() });
}

async function waitForManifest(): Promise<Response> {
  try {
    const response = await Time.waitFor(
      async () => {
        try {
          const response = await fetch(MANIFEST_URL, { redirect: 'manual' });
          return response.status === 200 ? response : undefined;
        } catch {
          return undefined;
        }
      },
      { interval: 25, timeout: EXIT_TIMEOUT },
    );
    if (!response) throw Err.std('GUI Dist source did not return its manifest.');
    return response;
  } catch {
    throw Err.std('Timed out waiting for the GUI Dist source.');
  }
}

async function malformedRawRequest(): Promise<Uint8Array> {
  const conn = await Deno.connect({ hostname: HOSTNAME, port: PORT });
  try {
    const request = new TextEncoder().encode(
      `GET /dist.json HTTP/9.9\r\nHost: localhost:${PORT}\r\nConnection: close\r\n\r\n`,
    );
    let written = 0;
    while (written < request.byteLength) {
      written += await conn.write(request.subarray(written));
    }
    await conn.closeWrite();

    const chunks: Uint8Array[] = [];
    let total = 0;
    const buffer = new Uint8Array(4096);
    while (true) {
      const length = await conn.read(buffer);
      if (length === null) break;
      const chunk = Uint8Array.from(buffer.subarray(0, length));
      chunks.push(chunk);
      total += chunk.byteLength;
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } finally {
    conn.close();
  }
}

async function stopSource(source: SourceProcess): Promise<Deno.CommandOutput> {
  try {
    source.child.kill('SIGINT');
  } catch (cause) {
    if (!(cause instanceof Deno.errors.NotFound)) throw cause;
  }
  const output = await exitWithin(source, 'live source');
  assert(output.success && output.signal === null, 'Expected owned clean SIGINT settlement.');
  return output;
}

async function exitWithin(
  source: SourceProcess,
  label: string,
): Promise<Deno.CommandOutput> {
  const timeout = Time.delay(EXIT_TIMEOUT);
  try {
    const outcome = await Promise.race([
      source.output.then((output) => ({ kind: 'output' as const, output })),
      timeout.then(() => ({ kind: 'timeout' as const })),
    ]);
    if (outcome.kind === 'output') return outcome.output;

    try {
      source.child.kill('SIGKILL');
    } catch (cause) {
      if (!(cause instanceof Deno.errors.NotFound)) throw cause;
    }
    await source.output;
    throw Err.std(`Timed out waiting for ${label} exit.`);
  } finally {
    timeout.cancel();
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw Err.std(message);
}

async function requireBytes(path: t.StringPath): Promise<Uint8Array> {
  const result = await Fs.read(path);
  if (!(result.ok && result.data)) throw result.error;
  return result.data;
}

function assertBytes(actual: Uint8Array, expected: Uint8Array, label: string): void {
  assert(actual.byteLength === expected.byteLength, `Unexpected ${label} byte length.`);
  for (let index = 0; index < actual.byteLength; index += 1) {
    assert(actual[index] === expected[index], `Unexpected ${label} bytes.`);
  }
}

function assertSubstrateRefusal(response: Uint8Array, artifacts: readonly Uint8Array[]): void {
  const boundary = indexOfBytes(response, new TextEncoder().encode('\r\n\r\n'));
  assert(boundary >= 0, 'Expected framed substrate refusal.');
  const head = decode(response.subarray(0, boundary));
  assert(
    head.startsWith('HTTP/1.1 400 Bad Request\r\n'),
    `Expected fixed malformed-request refusal, received: ${head}`,
  );
  assert(response.byteLength === boundary + 4, 'Expected empty substrate refusal body.');

  for (const artifact of artifacts) {
    const markerLength = Math.min(32, artifact.byteLength);
    if (markerLength === 0) continue;
    const offsets = new Set([
      0,
      Math.floor((artifact.byteLength - markerLength) / 2),
      artifact.byteLength - markerLength,
    ]);
    for (const offset of offsets) {
      const marker = artifact.subarray(offset, offset + markerLength);
      assert(
        indexOfBytes(response, marker) < 0,
        'Unexpected artifact marker in substrate refusal.',
      );
    }
  }
}

function indexOfBytes(input: Uint8Array, candidate: Uint8Array): number {
  if (candidate.byteLength === 0) return 0;
  const end = input.byteLength - candidate.byteLength;
  for (let offset = 0; offset <= end; offset += 1) {
    let equal = true;
    for (let index = 0; index < candidate.byteLength; index += 1) {
      if (input[offset + index] !== candidate[index]) {
        equal = false;
        break;
      }
    }
    if (equal) return offset;
  }
  return -1;
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
