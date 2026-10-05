import { Hash } from '@sys/crypto/hash';
import { Fs, Is, Json, Num, type t, Time } from '../common.ts';
import { assertChromeExecutableInput, validateChromeExecutable } from '../u.chrome.executable.ts';

const EXECUTABLE_ARG = '--chrome-executable=';
const AUTHORITY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_AUTHORITY_AGE = 600_000;
const MAX_PREPARED_AGE = 120_000;
const MAX_RETAINED_RESIDUE_NAMES = 20;

export const BROWSER_PROOF_ROOT = Fs.resolve('./.tmp/browser-proof') as t.StringAbsolutePath;
export const BROWSER_AUTHORITY_FILE = Fs.join(
  BROWSER_PROOF_ROOT,
  'authority.json',
) as t.StringAbsolutePath;
export const BROWSER_BUNDLE_SOURCE = Fs.resolve(
  './src/m.server/m.Browser/-test/u.fixture.std-is.browser.ts',
) as t.StringAbsolutePath;
export const BROWSER_BUNDLE_FILE = Fs.join(
  BROWSER_PROOF_ROOT,
  'std-is.browser.js',
) as t.StringAbsolutePath;
export const BROWSER_BUNDLE_MANIFEST = Fs.join(
  BROWSER_PROOF_ROOT,
  'std-is.browser.json',
) as t.StringAbsolutePath;

export type BrowserProofAuthority = {
  readonly version: 1;
  readonly id: string;
  readonly createdAt: number;
  readonly executablePath: t.StringAbsolutePath;
};

export type BrowserBundleManifest = {
  readonly version: 1;
  readonly authorityId: string;
  readonly generatedAt: number;
  readonly sourceHash: string;
  readonly bundleHash: string;
};

/** Prove the static writable root is one real directory rather than a redirected alias. */
export async function assertBrowserProofRoot() {
  const info = await Fs.lstat(BROWSER_PROOF_ROOT);
  if (!info?.isDirectory || info.isSymlink) {
    throw new Error('Browser proof root must be a real directory.');
  }
  if (await Fs.realPath(BROWSER_PROOF_ROOT) !== BROWSER_PROOF_ROOT) {
    throw new Error('Browser proof root must equal its canonical real path.');
  }
}

/** Inspect bounded residue names without mutating retained evidence. */
export async function inspectBrowserProofResidue() {
  const names: string[] = [];
  let truncated = false;
  for await (const entry of Deno.readDir(BROWSER_PROOF_ROOT)) {
    if (names.length >= MAX_RETAINED_RESIDUE_NAMES) {
      truncated = true;
      break;
    }
    names.push(entry.name);
  }
  names.sort();
  return Object.freeze({ names: Object.freeze(names), truncated });
}

export function formatBrowserProofResidue(
  input: Awaited<ReturnType<typeof inspectBrowserProofResidue>>,
) {
  const names = input.names.map((name) => Json.stringify(name, 0)).join(', ');
  if (!names) return '<none>';
  return input.truncated ? `${names}, <additional evidence retained>` : names;
}

/** Read one fresh preflight authority binding retained through the complete task. */
export async function readBrowserProofAuthority(): Promise<BrowserProofAuthority> {
  await assertBrowserProofRoot();
  const result = await Fs.readJson<unknown>(BROWSER_AUTHORITY_FILE);
  const input = result.data;
  if (!result.ok || !isBrowserProofAuthority(input)) {
    throw new Error('Browser proof authority binding is missing or invalid.');
  }
  const now = Time.now.timestamp;
  if (input.createdAt > now + 5_000 || now - input.createdAt > MAX_AUTHORITY_AGE) {
    throw new Error('Browser proof authority binding is stale.');
  }
  assertChromeExecutableInput(input.executablePath);
  return Object.freeze({ ...input });
}

/** Parse one closed proof argument and reject caller-appended task input. */
export function browserProofExecutableInput(args: readonly string[]) {
  if (args.length !== 1 || !args[0].startsWith(EXECUTABLE_ARG)) {
    throw new TypeError(
      'Browser proof requires exactly one --chrome-executable=<absolute-path> argument.',
    );
  }
  return args[0].slice(EXECUTABLE_ARG.length);
}

/** Resolve and verify the sole executable argument admitted by the finite proof task. */
export async function browserProofExecutable(): Promise<t.StringAbsolutePath> {
  const executablePath = browserProofExecutableInput(Deno.args);
  const authority = await readBrowserProofAuthority();
  if (authority.executablePath !== executablePath) {
    throw new Error('Browser proof argument does not match its preflight authority binding.');
  }
  const validated = await validateChromeExecutable(executablePath, {
    writableRoots: [BROWSER_PROOF_ROOT],
  });
  const permission = await Deno.permissions.query({ name: 'run', command: validated });
  if (permission.state !== 'granted') {
    throw new Deno.errors.NotCapable('Browser proof executable is not granted.');
  }
  return validated;
}

/** Consume one fresh, integrity-bound Deno-only preparation artifact exactly once. */
export async function consumePreparedBrowserBundle(): Promise<Uint8Array> {
  const authority = await readBrowserProofAuthority();
  const manifestResult = await Fs.readJson<unknown>(BROWSER_BUNDLE_MANIFEST);
  const bundleResult = await Fs.read(BROWSER_BUNDLE_FILE);
  const sourceResult = await Fs.read(BROWSER_BUNDLE_SOURCE);

  if (
    !manifestResult.ok || !bundleResult.ok || !bundleResult.data || !sourceResult.ok ||
    !sourceResult.data
  ) {
    throw new Error('Browser bundle preparation is missing or unreadable.');
  }
  const manifest = manifestResult.data;
  if (!isBrowserBundleManifest(manifest)) {
    throw new Error('Browser bundle preparation manifest is invalid.');
  }
  if (manifest.authorityId !== authority.id) {
    throw new Error('Browser bundle preparation belongs to another authority binding.');
  }

  const now = Time.now.timestamp;
  if (manifest.generatedAt > now + 5_000 || now - manifest.generatedAt > MAX_PREPARED_AGE) {
    throw new Error('Browser bundle preparation is stale.');
  }

  const source = sourceResult.data;
  const bundle = bundleResult.data;
  if (Hash.sha256(source) !== manifest.sourceHash) {
    throw new Error('Browser bundle source changed after preparation.');
  }
  if (Hash.sha256(bundle) !== manifest.bundleHash) {
    throw new Error('Browser bundle integrity check failed.');
  }

  const manifestRemoved = await Fs.remove(BROWSER_BUNDLE_MANIFEST);
  const bundleRemoved = await Fs.remove(BROWSER_BUNDLE_FILE);
  if (!manifestRemoved || !bundleRemoved) {
    throw new Error('Browser bundle preparation could not be consumed exactly once.');
  }
  return bundle;
}

function isBrowserProofAuthority(input: unknown): input is BrowserProofAuthority {
  return Is.record(input) && input.version === 1 && Is.str(input.id) &&
    AUTHORITY_ID.test(input.id) && Num.Is.safeInt(input.createdAt) && input.createdAt >= 0 &&
    Is.str(input.executablePath);
}

function isBrowserBundleManifest(input: unknown): input is BrowserBundleManifest {
  return Is.record(input) && input.version === 1 && Is.str(input.authorityId) &&
    AUTHORITY_ID.test(input.authorityId) && Num.Is.safeInt(input.generatedAt) &&
    input.generatedAt >= 0 && Is.str(input.sourceHash) && Is.str(input.bundleHash);
}
