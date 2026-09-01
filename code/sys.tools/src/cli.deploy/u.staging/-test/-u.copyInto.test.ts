import { withTmpDir } from '../../-test/u.fixture.ts';
import { describe, expect, expectError, Fs, it } from '../../../-test.ts';
import { copyInto } from '../u.copyInto.ts';
import { captureDirectoryIdentity } from '../u.staging.identity.ts';
import { createStagingManifestLedger } from '../u.staging.manifest.ts';

describe('Staging: copyInto', () => {
  it('copies one directory tree into a fresh destination', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const dst = `${tmp}/dst`;
      await Fs.ensureDir(`${src}/assets`);
      await Fs.write(`${src}/a.txt`, 'a');
      await Fs.write(`${src}/assets/app.js`, 'app');

      await copyDirectory(src, dst);

      expect((await Fs.readText(`${dst}/a.txt`)).data).to.eql('a');
      expect((await Fs.readText(`${dst}/assets/app.js`)).data).to.eql('app');
    });
  });

  it('fails rather than choosing collision order', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const dst = `${tmp}/dst`;
      await Fs.ensureDir(src);
      await Fs.ensureDir(dst);
      await Fs.write(`${src}/a.txt`, 'incoming');
      await Fs.write(`${dst}/a.txt`, 'existing');

      await expectError(() => copyDirectory(src, dst));
      expect((await Fs.readText(`${dst}/a.txt`)).data).to.eql('existing');
    });
  });

  it('skips .DS_Store files', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const dst = `${tmp}/dst`;
      await Fs.ensureDir(src);
      await Fs.write(`${src}/.DS_Store`, 'ignored');
      await Fs.write(`${src}/keep.txt`, 'keep');

      await copyDirectory(src, dst);

      expect(await Fs.exists(`${dst}/.DS_Store`)).to.eql(false);
      expect((await Fs.readText(`${dst}/keep.txt`)).data).to.eql('keep');
    });
  });

  it('rejects portable aliases of the reserved Dist manifest name', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const dst = `${tmp}/dst`;
      await Fs.ensureDir(src);
      await Fs.write(`${src}/DIST.JSON`, '{}');

      await expectError(
        () => copyDirectory(src, dst),
        'Deploy staging source contains an unsupported entry',
      );
      expect(await Fs.exists(`${dst}/DIST.JSON`)).to.eql(false);
      expect(await Fs.exists(`${dst}/dist.json`)).to.eql(false);
    });
  });

  it('rejects portable aliases of the generated index name', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const dst = `${tmp}/dst`;
      await Fs.ensureDir(src);
      await Fs.write(`${src}/INDEX.HTML`, '<html></html>');

      await expectError(
        () => copyDirectory(src, dst),
        'Deploy staging source contains an unsupported entry',
      );
      expect(await Fs.exists(`${dst}/INDEX.HTML`)).to.eql(false);
      expect(await Fs.exists(`${dst}/index.html`)).to.eql(false);
    });
  });

  it('rejects a directory occupying the reserved Dist manifest path', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const dst = `${tmp}/dst`;
      await Fs.ensureDir(`${src}/dist.json`);

      await expectError(
        () => copyDirectory(src, dst),
        'Deploy staging source contains an unsupported entry',
      );
      expect(await Fs.exists(`${dst}/dist.json`)).to.eql(false);
    });
  });

  it('rejects symbolic and special source entries', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const outside = `${tmp}/outside.txt`;
      await Fs.ensureDir(src);
      await Fs.write(outside, 'outside');
      await Fs.ensureSymlink(outside, `${src}/linked.txt`);

      await expectError(
        () => copyDirectory(src, `${tmp}/dst`),
        'Deploy staging source contains an unsupported entry',
      );
      expect((await Fs.readText(outside)).data).to.eql('outside');
    });
  });
});

async function copyDirectory(src: string, dst: string): Promise<void> {
  await Fs.ensureDir(dst);
  const sourceIdentity = await captureDirectoryIdentity({
    path: src,
    label: 'Test source',
  });
  const destinationIdentity = await captureDirectoryIdentity({
    path: dst,
    label: 'Test destination',
  });
  await copyInto({
    src,
    dst,
    sourceIdentity,
    destinationIdentity,
    manifestLedger: createStagingManifestLedger(),
  });
}
