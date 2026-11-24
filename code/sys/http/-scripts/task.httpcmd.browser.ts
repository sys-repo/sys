import { Process } from '@sys/process';
import { Browser, Fs } from '@sys/testing/server';
import { BUNDLE_NAME, SCRATCH } from '../src/http.cmd/-test.external/u.fixture.ts';

if (Deno.args.length) throw new TypeError('HttpCmd browser proof accepts no arguments.');

const root = Fs.resolve(SCRATCH);
await Fs.ensureDir(root);
const scratch = await Fs.Capability.Rooted.create({ root, create: false });
if (scratch.path !== root) throw new Error('Browser proof scratch must be canonical.');

const chromeBin = Deno.env.get('CHROME_BIN');
const executable = await Browser.Executable.admit(chromeBin, { writableRoots: [root] });
Deno.env.delete('CHROME_BIN'); // Pass the admitted path to the proof via argv only.

for await (const entry of Fs.walk(root, { maxDepth: 1, includeSymlinks: true })) {
  if (entry.path === root) continue;
  throw new Error(`Inspect retained browser proof evidence in ${SCRATCH} before retrying.`);
}

// Keep the owner's populated Deno cache while excluding unrelated environment variables.
const cache = Deno.env.get('DENO_DIR');
const output = await Process.capture({
  args: [
    'bundle',
    '--platform=browser',
    '--frozen',
    '--deny-import',
    '--node-modules-dir=manual',
    './src/http.cmd/-test.external/page.ts',
  ],
  clearEnv: true,
  env: { FORCE_COLOR: '0', ...(cache ? { DENO_DIR: cache } : {}) },
  executionTimeout: 30_000,
  maxStdoutBytes: 2_000_000,
  maxStderrBytes: 100_000,
});
if (!output.success || output.stdoutTruncated || output.stderrTruncated) {
  throw new Error(`Could not prepare HttpCmd browser bundle: ${output.text.stderr.trim()}`);
}
// Publish without replacing evidence, including a bundle from a competing run.
const { targets: [bundle] } = await scratch.Target.admit([{ kind: 'file', path: BUNDLE_NAME }]);
await scratch.File.publish(bundle, output.stdout);

const proof = await Process.inherit({
  env: { TMPDIR: SCRATCH },
  args: [
    'test',
    '--frozen',
    '--cached-only',
    '--no-prompt',
    '-P=test-browser',
    `--allow-read=${SCRATCH},${executable}`,
    `--allow-run=${executable}`,
    '--trace-leaks',
    './src/http.cmd/-test.external/-echo.browser-proof.ts',
    '--',
    executable,
  ],
});
Deno.exitCode = proof.code;
