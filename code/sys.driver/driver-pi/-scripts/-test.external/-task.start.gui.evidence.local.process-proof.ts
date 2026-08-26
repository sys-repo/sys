import { Fs, Is, Json, type t } from '../m.start.gui.evidence.local/common.ts';
import { EVIDENCE_GENERATED_MESSAGE } from '../m.start.gui.evidence.local/mod.ts';

const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..') as t.StringAbsoluteDir;
const EVIDENCE_PATH = Fs.join(
  PACKAGE_ROOT,
  'src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts',
);
const TEST_TMP_ROOT = Fs.join(PACKAGE_ROOT, '.tmp');
const GENERATOR_ARGS = ['task', 'start:gui:evidence:local'] as const;

const expected = await Deno.readFile(EVIDENCE_PATH);
await Fs.ensureDir(TEST_TMP_ROOT);
const emptyCache = await Fs.makeTempDir({
  dir: TEST_TMP_ROOT,
  prefix: 'driver-pi.evidence.empty-cache.',
});

let proofFailed = false;
let proofFailure: unknown;
try {
  const missing = await runGenerator(emptyCache.absolute);
  assert(!missing.success, 'The generator unexpectedly succeeded with an empty import cache.');
  assert(
    !decode(missing.stdout).includes(EVIDENCE_GENERATED_MESSAGE),
    'The empty-cache run reported successful generation.',
  );
  assert(
    await evidenceEquals(expected),
    'The empty-cache run changed the checked-in evidence leaf.',
  );

  const primed = await runGenerator(await resolveDenoDir());
  assert(primed.success, `The primed-cache generator failed: ${decode(primed.stderr)}`);
  assert(
    decode(primed.stdout).trim() === EVIDENCE_GENERATED_MESSAGE,
    'The primed-cache generator did not report exact successful settlement.',
  );
  assert(
    await evidenceEquals(expected),
    'The primed-cache generator did not reproduce the checked-in evidence leaf.',
  );
} catch (cause) {
  proofFailed = true;
  proofFailure = cause;
}

const cleanup = await cleanupProcessProof(expected, emptyCache.absolute);
if (proofFailed && !cleanup.ok) {
  throw new SuppressedError(
    proofFailure,
    cleanup.error,
    'Driver Pi local GUI evidence process proof failed and cleanup also failed.',
  );
}
if (proofFailed) throw proofFailure;
if (!cleanup.ok) throw cleanup.error;

console.info('PASS Driver Pi local GUI evidence cache process proof.');

async function runGenerator(denoDir: t.StringAbsoluteDir): Promise<Deno.CommandOutput> {
  const systemRoot = Deno.build.os === 'windows' ? Deno.env.get('SystemRoot') : undefined;
  return await new Deno.Command(Deno.execPath(), {
    args: [...GENERATOR_ARGS],
    cwd: PACKAGE_ROOT,
    clearEnv: true,
    env: {
      DENO_DIR: denoDir,
      ...(systemRoot ? { SystemRoot: systemRoot } : {}),
    },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

async function resolveDenoDir(): Promise<t.StringAbsoluteDir> {
  const configured = Deno.env.get('DENO_DIR');
  if (configured) return Fs.resolve(configured) as t.StringAbsoluteDir;

  const output = await new Deno.Command(Deno.execPath(), {
    args: ['info', '--json'],
    cwd: PACKAGE_ROOT,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) {
    throw new Error(`Unable to resolve the primed Deno cache: ${decode(output.stderr)}`);
  }

  const info = Json.parse<{ denoDir?: unknown }>(decode(output.stdout));
  const denoDir = Is.object(info) ? info.denoDir : undefined;
  if (!Is.string(denoDir)) throw new Error('Unable to resolve the primed Deno cache.');
  return Fs.resolve(denoDir) as t.StringAbsoluteDir;
}

async function evidenceEquals(expected: Uint8Array): Promise<boolean> {
  let actual: Uint8Array;
  try {
    actual = await Deno.readFile(EVIDENCE_PATH);
  } catch {
    return false;
  }
  if (actual.byteLength !== expected.byteLength) return false;
  for (let index = 0; index < actual.byteLength; index += 1) {
    if (actual[index] !== expected[index]) return false;
  }
  return true;
}

async function cleanupProcessProof(
  expected: Uint8Array,
  cacheDir: t.StringAbsoluteDir,
): Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: unknown }>> {
  const settled = await Promise.allSettled([
    restoreEvidence(expected),
    Fs.remove(cacheDir),
  ]);
  const failures: unknown[] = [];
  for (const result of settled) {
    if (result.status === 'rejected') failures.push(result.reason);
  }
  if (failures.length === 0) return Object.freeze({ ok: true as const });
  const error = failures.length === 1
    ? failures[0]
    : new AggregateError(failures, 'Driver Pi local GUI evidence process cleanup failed.');
  return Object.freeze({ ok: false as const, error });
}

async function restoreEvidence(expected: Uint8Array): Promise<void> {
  if (await evidenceEquals(expected)) return;
  await Deno.writeFile(EVIDENCE_PATH, expected);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function decode(input: Uint8Array): string {
  return new TextDecoder().decode(input);
}
