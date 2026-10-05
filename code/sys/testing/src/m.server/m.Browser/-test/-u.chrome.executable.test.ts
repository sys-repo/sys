import { describe, expect, Fs, Hash, it, Time } from '../../-test.ts';
import { Browser } from '../mod.ts';
import { assertChromeExecutableInput, validateChromeExecutable } from '../u.chrome.executable.ts';
import {
  BROWSER_BUNDLE_FILE,
  BROWSER_BUNDLE_MANIFEST,
  BROWSER_BUNDLE_SOURCE,
  BROWSER_PROOF_ROOT,
  type BrowserBundleManifest,
  browserProofExecutableInput,
  consumePreparedBrowserBundle,
  readBrowserProofAuthority,
} from './u.browser.proof.ts';

describe('Browser Chrome executable admission', () => {
  it('permission transport → rejects list injection and accepts quoted single-argument values', async () => {
    const denoPermission = await Deno.permissions.query({
      name: 'run',
      command: Deno.execPath(),
    });
    expect(denoPermission.state === 'granted').to.eql(false);

    for (
      const args of [
        [],
        ['--allow-run=/bin/sh'],
        ['--chrome-executable=/Applications/Chrome', '--allow-run=/bin/sh'],
      ]
    ) {
      expect(() => browserProofExecutableInput(args)).to.throw();
    }

    for (
      const input of [
        '',
        'relative/chrome',
        '/tmp/chrome,sh',
        '/tmp/chrome\0sh',
        '/tmp/chrome\rsh',
        '/tmp/chrome\nsh',
      ]
    ) {
      expect(() => assertChromeExecutableInput(input)).to.throw();
    }

    if (Deno.build.os !== 'windows') {
      for (
        const input of [
          '/Applications/Chrome with spaces',
          '/Applications/Chrome "double"',
          "/Applications/Chrome 'single'",
          '/Applications/Chrome $() | `tick` > target',
          '/Applications/Chrome\\backslash',
        ]
      ) {
        expect(() => assertChromeExecutableInput(input)).not.to.throw();
        expect(browserProofExecutableInput([`--chrome-executable=${input}`])).to.eql(input);
      }
    }
  });

  it('public seam → requires writable-root authority and preserves the admitted path', async () => {
    const canonical = await Fs.realPath(Deno.execPath());
    const writableRoots = [BROWSER_PROOF_ROOT];
    const admission = Browser.Executable.admit(canonical, { writableRoots });
    writableRoots[0] = canonical;
    expect(await admission).to.eql(canonical);

    let caught: unknown;
    try {
      await Browser.Executable.admit(canonical, undefined as never);
    } catch (cause) {
      caught = cause;
    }
    expect(caught).to.be.instanceOf(TypeError);
    expect((caught as Error).message).to.contain('explicit writableRoots array');
  });

  it('prepared bundle → rejects and retains stale or altered evidence', async () => {
    const authority = await readBrowserProofAuthority();
    const source = await Fs.read(BROWSER_BUNDLE_SOURCE);
    if (!source.ok || !source.data) throw source.error ?? new Error('Expected bundle source.');
    const bundle = new TextEncoder().encode('console.info("prepared-browser-fixture");');
    const base = {
      version: 1 as const,
      authorityId: authority.id,
      sourceHash: Hash.sha256(source.data),
      bundleHash: Hash.sha256(bundle),
    };

    await writePreparedFixture(bundle, { ...base, generatedAt: Time.now.timestamp - 120_001 });
    await expectBundleFailure('stale');

    await writePreparedFixture(bundle, {
      ...base,
      authorityId: crypto.randomUUID(),
      generatedAt: Time.now.timestamp,
    });
    await expectBundleFailure('another authority');

    await writePreparedFixture(bundle, {
      ...base,
      generatedAt: Time.now.timestamp,
      bundleHash: Hash.sha256('different-bundle'),
    });
    await expectBundleFailure('integrity');
  });

  it('filesystem identity → admits only canonical regular executables outside write authority', async () => {
    const canonical = await Fs.realPath(Deno.execPath());
    expect(await validateChromeExecutable(canonical, { writableRoots: [BROWSER_PROOF_ROOT] }))
      .to.eql(canonical);

    const canonicalInfo = await Fs.lstat(canonical);
    if (!canonicalInfo) throw new Error('Expected Deno executable metadata.');
    await expectValidationFailure(canonical, 'symbolic link', {
      lstat: () => Promise.resolve({ ...canonicalInfo, isSymlink: true }),
      realPath: Fs.realPath,
    });

    const fixture = Fs.join(BROWSER_PROOF_ROOT, `executable-${crypto.randomUUID()}`);
    const directory = `${fixture}-directory`;
    try {
      await Deno.writeTextFile(fixture, '#!/bin/sh\nexit 0\n');
      if (Deno.build.os !== 'windows') await Deno.chmod(fixture, 0o700);
      await Fs.ensureDir(directory);

      await expectValidationFailure(directory, 'regular file');
      await expectValidationFailure(fixture, 'outside proof-child write authority');
      await expectValidationFailure(`${fixture}-missing`, 'does not exist');
    } finally {
      await Fs.remove(directory);
      await Fs.remove(fixture);
    }
  });

  it('target replacement fixture → remains non-executable after admission fails closed', async () => {
    const fixture = Fs.join(BROWSER_PROOF_ROOT, `replaceable-${crypto.randomUUID()}`);
    try {
      await Deno.writeTextFile(fixture, '#!/bin/sh\nexit 0\n');
      if (Deno.build.os !== 'windows') await Deno.chmod(fixture, 0o700);

      await expectValidationFailure(fixture, 'outside proof-child write authority');
      const permission = await Deno.permissions.query({ name: 'run', command: fixture });
      expect(permission.state === 'granted').to.eql(false);
    } finally {
      await Fs.remove(fixture);
    }
  });
});

async function writePreparedFixture(bundle: Uint8Array, manifest: BrowserBundleManifest) {
  const bundleWrite = await Fs.write(BROWSER_BUNDLE_FILE, bundle, { throw: true });
  if (bundleWrite.error) throw bundleWrite.error;
  const manifestWrite = await Fs.writeJson(BROWSER_BUNDLE_MANIFEST, manifest, { throw: true });
  if (manifestWrite.error) throw manifestWrite.error;
}

async function expectBundleFailure(message: string) {
  let caught: unknown;
  try {
    await consumePreparedBrowserBundle();
  } catch (cause) {
    caught = cause;
  }
  expect(caught).to.be.instanceOf(Error);
  expect((caught as Error).message).to.contain(message);
  expect(await Fs.exists(BROWSER_BUNDLE_FILE)).to.eql(true);
  expect(await Fs.exists(BROWSER_BUNDLE_MANIFEST)).to.eql(true);
  await Fs.remove(BROWSER_BUNDLE_MANIFEST);
  await Fs.remove(BROWSER_BUNDLE_FILE);
}

async function expectValidationFailure(
  path: string,
  message: string,
  deps?: Parameters<typeof validateChromeExecutable>[2],
) {
  let caught: unknown;
  try {
    await validateChromeExecutable(path, { writableRoots: [BROWSER_PROOF_ROOT] }, deps);
  } catch (cause) {
    caught = cause;
  }
  expect(caught).to.be.instanceOf(Error);
  expect((caught as Error).message).to.contain(message);
}
