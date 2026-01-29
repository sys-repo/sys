import { describe, expect, Fs, it } from '../../../-test.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import { CrdtReposFs } from '../u.fs.ts';

describe('CrdtReposFs', () => {
  it('writeDoc + readYaml roundtrip', async () => {
    await withTmpDir(async (cwd) => {
      const path = Fs.join(cwd, CrdtReposFs.file());
      await CrdtReposFs.writeDoc(path, {
        sync: ['waiheke.sync.db.team'],
        ports: { repo: 49494, sync: 3030 },
      });
      const res = await CrdtReposFs.readYaml(path);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.doc).to.eql({
          sync: ['waiheke.sync.db.team'],
          ports: { repo: 49494, sync: 3030 },
        });
      }
    });
  });

  it('loadPorts uses defaults when missing', async () => {
    await withTmpDir(async (cwd) => {
      const ports = await CrdtReposFs.loadPorts(cwd);
      expect(ports).to.eql({ repo: 49494, sync: 3030 });
    });
  });
});
