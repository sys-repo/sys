import { Fs, Process } from './common.ts';
import {
  assertBrowserProofRoot,
  BROWSER_AUTHORITY_FILE,
  BROWSER_PROOF_ROOT,
  formatBrowserProofResidue,
  inspectBrowserProofResidue,
  readBrowserProofAuthority,
} from '../src/m.server/m.Browser/-test/u.browser.proof.ts';

if (Deno.args.length > 0) throw new TypeError('Browser postflight accepts no arguments.');

await assertBrowserProofRoot();
await readBrowserProofAuthority();
const ps = Deno.build.os === 'darwin'
  ? '/bin/ps'
  : Deno.build.os === 'linux'
  ? '/usr/bin/ps'
  : undefined;
if (!ps) throw new Error(`Browser proof postflight is unsupported on ${Deno.build.os}.`);
const psPermission = await Deno.permissions.query({ name: 'run', command: ps });
const denoPermission = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
if (psPermission.state !== 'granted' || denoPermission.state === 'granted') {
  throw new Error('Browser postflight permission profile is not observer-only.');
}

const output = await Process.capture({
  cmd: ps,
  args: ['-axo', 'command='],
  clearEnv: true,
  env: { FORCE_COLOR: '0' },
  executionTimeout: 5_000,
  maxStdoutBytes: 2_000_000,
  maxStderrBytes: 100_000,
});
if (
  output.outcome !== 'exited' || !output.success || output.stdoutTruncated ||
  output.stderrTruncated
) {
  const detail = output.text.stderr.trim() || `outcome=${output.outcome}`;
  throw new Error(`Browser proof process observation failed: ${detail}`);
}
if (output.text.stdout.includes(BROWSER_PROOF_ROOT)) {
  throw new Error('Browser proof left a process carrying its unique profile-root marker.');
}

const residue = await inspectBrowserProofResidue();
const authorityName = Fs.basename(BROWSER_AUTHORITY_FILE);
if (
  residue.truncated || residue.names.length !== 1 || residue.names[0] !== authorityName
) {
  throw new Error(`Browser proof retained owned residue: ${formatBrowserProofResidue(residue)}`);
}

if (!await Fs.remove(BROWSER_AUTHORITY_FILE)) {
  throw new Error('Browser proof authority binding could not be released.');
}
const afterRelease = await inspectBrowserProofResidue();
if (afterRelease.names.length > 0 || afterRelease.truncated) {
  throw new Error(
    `Browser proof retained residue after authority release: ${
      formatBrowserProofResidue(afterRelease)
    }`,
  );
}
if (!await Fs.remove(BROWSER_PROOF_ROOT, { recursive: false })) {
  throw new Error('Browser proof root could not be released.');
}
