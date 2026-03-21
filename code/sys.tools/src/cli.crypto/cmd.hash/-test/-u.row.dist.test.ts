import { describe, expect, it } from '../../../-test.ts';
import { type t, Fs } from '../../common.ts';
import { HashRowDist } from '../mod.ts';

describe('cli.crypto/cmd.hash/u.row.dist', () => {
  const digest = 'sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const other = 'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  it('hides dist row when missing and not saving', async () => {
    const res = await HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: false, kind: 'missing' },
      saveDist: false,
      digest,
    });
    expect(res).to.eql(undefined);
  });

  it('marks created when saving and dist.json was missing', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;
    const path = Fs.join(dir, 'dist.json');
    try {
      await Fs.write(path, '{}');
      const stat = await Fs.stat(path);
      if (!stat) throw new Error(`Expected stat for ${path}`);
      const res = await HashRowDist.afterRun({
        before: { path, exists: false, kind: 'missing' },
        saveDist: true,
        digest,
      });
      expect(res).to.eql({ path, status: 'created', sizeBytes: stat.size });
    } finally {
      await Fs.remove(dir);
    }
  });

  it('marks differs when canonical dist exists and digest differs without save', async () => {
    const res = await HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: true, kind: 'canonical', sizeBytes: 128, digest: other },
      saveDist: false,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json', sizeBytes: 128, status: 'differs' });
  });

  it('marks invalid when non-canonical dist exists without save', async () => {
    const res = await HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: true, kind: 'legacy', sizeBytes: 64 },
      saveDist: false,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json', sizeBytes: 64, status: 'invalid' });
  });

  it('marks changed when saving over invalid dist', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;
    const path = Fs.join(dir, 'dist.json');
    try {
      await Fs.write(path, '{"ok":true}');
      const stat = await Fs.stat(path);
      if (!stat) throw new Error(`Expected stat for ${path}`);
      const res = await HashRowDist.afterRun({
        before: { path, exists: true, kind: 'invalid', sizeBytes: 9 },
        saveDist: true,
        digest,
      });
      expect(res).to.eql({ path, sizeBytes: stat.size, status: 'changed' });
    } finally {
      await Fs.remove(dir);
    }
  });

  it('shows plain dist row when canonical digest matches', async () => {
    const res = await HashRowDist.afterRun({
      before: { path: '/x/dist.json', exists: true, kind: 'canonical', sizeBytes: 256, digest },
      saveDist: false,
      digest,
    });
    expect(res).to.eql({ path: '/x/dist.json', sizeBytes: 256 });
  });
});
