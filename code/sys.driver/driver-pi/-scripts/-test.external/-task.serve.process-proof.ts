import type { t } from '../common.ts';
import { default as deno } from '../../deno.json' with { type: 'json' };
import { c, Table } from '@sys/cli/fmt';
import { Fs } from '@sys/fs';
import { Dist as FsDist } from '@sys/fs/pkg';
import { Err } from '@sys/std/error';
import { Is } from '@sys/std/is';
import { Obj } from '@sys/std/obj';
import { Str } from '@sys/std/str';
import { Time } from '@sys/std/time';

const HOSTNAME = '127.0.0.1';
const PORT = 8080;
const ORIGIN = 'http://localhost:8080';
const MANIFEST_URL = `${ORIGIN}/dist.json`;
const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../..');
const DIST_DIR: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, 'dist');
const OPENER_PATHS = deno.permissions.serve.run;
const SERVE_ARGS = [
  'run',
  '--frozen',
  '--cached-only',
  '--no-prompt',
  '-P=serve',
  './-scripts/task.vite.ts',
  '--cmd=serve',
  '--port=8080',
] as const;
const SERVE_TASK = `FORCE_COLOR=0 deno ${SERVE_ARGS.join(' ')}`;
const EXIT_TIMEOUT = 15_000;
const SERVE_IN_USE_BODY = Str.dedent(`
  package    @sys/driver-pi@${deno.version}
  service    local dist server
  listener   127.0.0.1:8080
  state      IN USE (not started)
  retry      deno task serve
`);

const PREVIEW_LIMITS = Object.freeze({
  manifestBytes: 16 * 1024 * 1024,
  entries: 8_193,
  fileBytes: 128 * 1024 * 1024,
  totalBytes: 1024 * 1024 * 1024,
});

type Candidate = Readonly<{
  manifest: Uint8Array;
  part: Readonly<{
    path: string;
    bytes: Uint8Array;
  }>;
}>;

type ServeProcess = Readonly<{
  child: Deno.ChildProcess;
  output: Promise<Deno.CommandOutput>;
}>;

type ServeProofListener =
  | Readonly<{ kind: 'acquired'; listener: Deno.Listener }>
  | Readonly<{ kind: 'in-use' }>;

try {
  assert(deno.tasks.serve === SERVE_TASK, 'Serve process vector differs from the configured task.');
  const candidate = await requirePreparedDist();
  const portOwnership = await proveOccupiedPortRefusal();
  if (portOwnership === 'acquired') {
    await proveLiveServe(candidate);
    printSummary(candidate);
  } else {
    console.error(`Cannot complete live serve proof: ${HOSTNAME}:${PORT} is externally owned.`);
    Deno.exitCode = 1;
  }
} catch (cause) {
  printTitle('fail');
  throw cause;
}

async function requirePreparedDist(): Promise<Candidate> {
  const verified = await FsDist.Local.verify({ dir: DIST_DIR, limits: PREVIEW_LIMITS });
  if (verified.kind !== 'verified') {
    throw new Error(
      `The explicit local Dist serve process proof requires one prepared frozen dist/: ${verified.kind}.`,
    );
  }

  const path = Obj.keys(verified.evidence.dist.hash.parts).sort()[0];
  if (!Is.string(path) || path.length === 0) {
    throw Err.std('The prepared local Dist contains no representative part.');
  }

  const authority = FsDist.Part.parse(verified.evidence.dist.hash.parts[path]);
  if (!authority || authority.size === undefined) {
    throw Err.std(`The representative local Dist part is malformed: ${path}`);
  }
  const read = await FsDist.Local.readPart({
    dir: DIST_DIR,
    path,
    checksum: authority.hash,
    size: authority.size,
  });
  if (read.kind !== 'read') {
    throw Err.std(`The representative local Dist part is unreadable: ${path}/${read.kind}`);
  }

  return Object.freeze({
    manifest: await requireBytes(Fs.join(DIST_DIR, 'dist.json')),
    part: Object.freeze({ path, bytes: read.bytes }),
  });
}

async function proveOccupiedPortRefusal(): Promise<'acquired' | 'in-use'> {
  const acquired = acquireServeProofListener();

  try {
    const process = spawnServe();
    const output = await exitWithin(process, 'occupied-port serve');
    const stdout = decode(output.stdout);
    const stderr = decode(output.stderr);
    const terminal = `${stdout}\n${stderr}`;
    const normalized = Str.trimEdgeNewlines(stdout);
    const table = `${SERVE_IN_USE_BODY}\n\n`;
    const rule = normalized.slice(table.length);

    assert(output.code === 1, 'Expected occupied-port serve to exit with code 1.');
    assert(normalized.startsWith(table), 'Expected the occupied-port table as sole stdout.');
    assert(rule.length > 0 && rule === '━'.repeat(rule.length), 'Expected one heavy outcome rule.');
    assert(stdout === `${normalized}\n`, 'Expected exactly one trailing stdout newline.');
    assert(!terminal.includes('Usage:'), 'Unexpected duplicate serve usage block.');
    assert(!terminal.includes('DistServer.start:'), 'Unexpected raw Dist server failure.');
    assert(!terminal.includes('Failed to resolve'), 'Unexpected opener-resolution diagnostic.');
    assert(!terminal.includes('Uncaught'), 'Unexpected occupied-port serve stack.');
    return acquired.kind;
  } finally {
    if (acquired.kind === 'acquired') acquired.listener.close();
  }
}

async function proveLiveServe(candidate: Candidate): Promise<void> {
  const process = spawnServe();
  let output: Deno.CommandOutput;
  try {
    const manifest = await waitForManifest();
    assertBytes(new Uint8Array(await manifest.arrayBuffer()), candidate.manifest, 'manifest');

    const route = `/${candidate.part.path.split('/').map(encodeURIComponent).join('/')}`;
    const part = await fetch(`${ORIGIN}${route}`, { redirect: 'manual' });
    assert(part.status === 200, `Expected representative part response: ${route}`);
    assertBytes(
      new Uint8Array(await part.arrayBuffer()),
      candidate.part.bytes,
      'representative part',
    );

    await expectRunning(process.output);
  } finally {
    output = await stopServe(process);
  }

  const terminal = `${decode(output.stdout)}\n${decode(output.stderr)}`;
  assert(!terminal.includes('Usage:'), 'Unexpected duplicate serve usage block.');
  assert(!terminal.includes('Failed to resolve'), 'Unexpected opener-resolution diagnostic.');
  assert(!terminal.includes('PermissionDenied'), 'Unexpected serve permission failure.');
  assert(!terminal.includes('NotCapable'), 'Unexpected serve capability failure.');
  assert(!terminal.includes('Uncaught'), 'Unexpected serve shutdown stack.');
  assertPortReleased();
}

function printSummary(candidate: Candidate): void {
  const endpoint = `${HOSTNAME}:${PORT}`;
  const serveEvidence = [
    c.cyan('--frozen'),
    c.cyan('--cached-only'),
    c.cyan(`--allow-run=${OPENER_PATHS.length} absolute paths`),
    c.cyan(endpoint),
  ].join(' · ');
  const manifestEvidence = [
    c.cyan('dist.json'),
    Str.bytes(candidate.manifest.byteLength),
    'exact bytes',
  ].join(' · ');
  const partEvidence = [
    c.cyan(candidate.part.path),
    Str.bytes(candidate.part.bytes.byteLength),
    'checksum-authenticated exact bytes',
  ].join(' · ');
  const rows = [
    { check: 'serve vector', evidence: serveEvidence },
    { check: 'occupied port', evidence: `IN USE outcome observed at ${c.cyan(endpoint)}` },
    { check: 'manifest', evidence: manifestEvidence },
    { check: 'representative part', evidence: partEvidence },
    { check: 'lifecycle', evidence: 'running → SIGINT delivered → settled' },
    { check: 'listener cleanup', evidence: `${c.cyan(endpoint)} reusable` },
  ] as const;
  const table = Table.create();

  table.push([c.gray('Check'), c.gray('Result'), c.gray('Evidence')]);
  for (const row of rows) table.push([c.white(row.check), c.green('PASS'), row.evidence]);

  printTitle('pass');
  console.info(Str.trimEdgeNewlines(String(table)));
  console.info();
  console.info(`${c.green('PASS')} ${rows.length} executable-boundary checks complete.`);
}

function printTitle(outcome: 'pass' | 'fail'): void {
  const color = outcome === 'pass' ? c.green : c.red;
  const title = c.bold(color(`${deno.name} · local Dist serve process proof`));
  if (outcome === 'pass') {
    console.info();
    console.info(title);
  } else {
    console.error();
    console.error(title);
  }
}

function spawnServe(): ServeProcess {
  const child = new Deno.Command(Deno.execPath(), {
    args: [...SERVE_ARGS],
    cwd: PACKAGE_ROOT,
    env: { FORCE_COLOR: '0' },
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
    if (!response) throw Err.std('Local Dist serve did not return its manifest.');
    return response;
  } catch {
    throw Err.std('Timed out waiting for local Dist serve.');
  }
}

async function expectRunning(output: Promise<Deno.CommandOutput>): Promise<void> {
  const grace = Time.delay(100);
  try {
    const exited = await Promise.race([
      output.then(() => true),
      grace.then(() => false),
    ]);
    assert(!exited, 'Local Dist serve exited before SIGINT delivery.');
  } finally {
    grace.cancel();
  }
}

async function stopServe(process: ServeProcess): Promise<Deno.CommandOutput> {
  const signalDelivered = signalChild(process.child, 'SIGINT');
  const output = await exitWithin(process, 'live serve');
  assert(signalDelivered, 'Expected successful primary SIGINT delivery.');
  assert(
    output.success || output.signal === 'SIGINT',
    'Expected bounded local Dist serve SIGINT settlement.',
  );
  return output;
}

async function exitWithin(
  process: ServeProcess,
  label: string,
): Promise<Deno.CommandOutput> {
  const timeout = Time.delay(EXIT_TIMEOUT);
  try {
    const outcome = await Promise.race([
      process.output.then((output) => ({ kind: 'output' as const, output })),
      timeout.then(() => ({ kind: 'timeout' as const })),
    ]);
    if (outcome.kind === 'output') return outcome.output;

    signalChild(process.child, 'SIGKILL');
    await process.output;
    throw Err.std(`Timed out waiting for ${label} exit.`);
  } finally {
    timeout.cancel();
  }
}

function signalChild(child: Deno.ChildProcess, signal: Deno.Signal): boolean {
  try {
    child.kill(signal);
    return true;
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return false;
    if (cause instanceof TypeError && cause.message === 'Child process has already terminated') {
      return false;
    }
    throw cause;
  }
}

function acquireServeProofListener(): ServeProofListener {
  try {
    return Object.freeze({
      kind: 'acquired' as const,
      listener: Deno.listen({ hostname: HOSTNAME, port: PORT }),
    });
  } catch (cause) {
    if (cause instanceof Deno.errors.AddrInUse) {
      return Object.freeze({ kind: 'in-use' as const });
    }
    throw cause;
  }
}

function assertPortReleased(): void {
  const listener = Deno.listen({ hostname: HOSTNAME, port: PORT });
  listener.close();
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

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
