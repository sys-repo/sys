import { Fs, Json, Time } from './common.ts';
import {
  assertBrowserProofRoot,
  BROWSER_AUTHORITY_FILE,
  BROWSER_PROOF_ROOT,
  type BrowserProofAuthority,
  formatBrowserProofResidue,
  inspectBrowserProofResidue,
} from '../src/m.server/m.Browser/-test/u.browser.proof.ts';
import { validateChromeExecutable } from '../src/m.server/m.Browser/u.chrome.executable.ts';

if (Deno.args.length > 0) throw new TypeError('Browser authority preflight accepts no arguments.');

const input = Deno.env.get('CHROME_BIN');
const executablePath = await validateChromeExecutable(input, {
  writableRoots: [BROWSER_PROOF_ROOT],
});
await prepareProofRoot();
const reboundPath = await validateChromeExecutable(input, {
  writableRoots: [BROWSER_PROOF_ROOT],
});
if (reboundPath !== executablePath) {
  throw new Error('Chrome executable identity changed during authority preflight.');
}

const executablePermission = await Deno.permissions.query({
  name: 'run',
  command: executablePath,
});
const denoPermission = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
if (executablePermission.state === 'granted' || denoPermission.state === 'granted') {
  throw new Error('Browser preflight unexpectedly received subprocess authority.');
}

const authority: BrowserProofAuthority = Object.freeze({
  version: 1,
  id: crypto.randomUUID(),
  createdAt: Time.now.timestamp,
  executablePath,
});
await Deno.writeTextFile(BROWSER_AUTHORITY_FILE, Json.stringify(authority, 2), {
  createNew: true,
});

console.info(`Browser proof authority preflight: ${executablePath}`);

async function prepareProofRoot() {
  const info = await Fs.lstat(BROWSER_PROOF_ROOT);
  if (info?.isSymlink || (info && !info.isDirectory)) {
    throw new Error('Browser proof root must be a real directory.');
  }
  if (info) {
    await assertBrowserProofRoot();
    const residue = await inspectBrowserProofResidue();
    if (residue.names.length > 0 || residue.truncated) {
      throw new Error(
        `Browser proof retained prior evidence; inspect before explicit cleanup: ${
          formatBrowserProofResidue(residue)
        }`,
      );
    }
  }

  await Fs.ensureDir(BROWSER_PROOF_ROOT);
  await assertBrowserProofRoot();
}
