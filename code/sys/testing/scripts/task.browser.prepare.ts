import { Fs, Hash, Process, Time } from './common.ts';
import {
  assertBrowserProofRoot,
  BROWSER_BUNDLE_FILE,
  BROWSER_BUNDLE_MANIFEST,
  BROWSER_BUNDLE_SOURCE,
  BROWSER_PROOF_ROOT,
  type BrowserBundleManifest,
  readBrowserProofAuthority,
} from '../src/m.server/m.Browser/-test/u.browser.proof.ts';

if (Deno.args.length > 0) throw new TypeError('Browser preparation accepts no arguments.');

await assertBrowserProofRoot();
const authority = await readBrowserProofAuthority();
if (await Fs.exists(BROWSER_BUNDLE_FILE) || await Fs.exists(BROWSER_BUNDLE_MANIFEST)) {
  throw new Error('Browser bundle preparation root was not reset by preflight.');
}
const denoPermission = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
const shellPermission = await Deno.permissions.query({ name: 'run', command: '/bin/sh' });
if (denoPermission.state !== 'granted' || shellPermission.state === 'granted') {
  throw new Error('Browser preparation permission profile is not Deno-only.');
}

const source = await Fs.read(BROWSER_BUNDLE_SOURCE);
if (!source.ok || !source.data) {
  throw source.error ?? new Error('Browser bundle source is missing.');
}

const output = await Process.capture({
  cmd: Deno.execPath(),
  args: [
    'bundle',
    '--platform=browser',
    '--frozen',
    '--no-remote',
    BROWSER_BUNDLE_SOURCE,
  ],
  cwd: Fs.cwd(),
  clearEnv: true,
  env: { FORCE_COLOR: '0' },
  executionTimeout: 30_000,
  maxStdoutBytes: 1_000_000,
  maxStderrBytes: 100_000,
});

if (
  output.outcome !== 'exited' || !output.success || output.stdoutTruncated ||
  output.stderrTruncated
) {
  const detail = output.text.stderr.trim() || `outcome=${output.outcome}`;
  throw new Error(`Failed to prepare browser bundle: ${detail}`);
}

const manifest: BrowserBundleManifest = Object.freeze({
  version: 1,
  authorityId: authority.id,
  generatedAt: Time.now.timestamp,
  sourceHash: Hash.sha256(source.data),
  bundleHash: Hash.sha256(output.stdout),
});

await Fs.ensureDir(BROWSER_PROOF_ROOT);
const bundleWrite = await Fs.write(BROWSER_BUNDLE_FILE, output.stdout, { throw: true });
if (bundleWrite.error) throw bundleWrite.error;
const manifestWrite = await Fs.writeJson(BROWSER_BUNDLE_MANIFEST, manifest, { throw: true });
if (manifestWrite.error) throw manifestWrite.error;
