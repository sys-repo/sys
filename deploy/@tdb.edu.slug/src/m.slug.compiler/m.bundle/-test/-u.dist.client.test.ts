import { describe, expect, Fs, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { writeDistClientFiles } from '../u.dist.client.ts';

const validBundle: t.BundleDescriptor = {
  kind: 'slug-tree:fs',
  version: 1,
  docid: 'slug:test',
  layout: {
    manifestsDir: 'manifests',
    contentDir: 'content',
  },
  files: {
    tree: 'slug-tree.slug-test.json',
  },
};

describe('BundleDescriptor', () => {
  it('writes `dist.client.json` for valid bundles', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const targetDir = Fs.join(tmpDir, 'manifests');
      const written = await writeDistClientFiles([{ dir: targetDir, bundle: validBundle }]);

      expect(written).to.eql(1);
      expect(await Fs.exists(Fs.join(targetDir, 'dist.client.json'))).to.eql(true);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('throws when schema validation fails', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const targetDir = Fs.join(tmpDir, 'manifests');
      const invalid = {
        kind: 'slug-tree:fs',
        version: 1,
        layout: {
          manifestsDir: 'manifests',
        },
      } as unknown as t.BundleDescriptor;

      let thrown = false;
      try {
        await writeDistClientFiles([{ dir: targetDir, bundle: invalid }]);
      } catch {
        thrown = true;
      }
      expect(thrown).to.eql(true);
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
