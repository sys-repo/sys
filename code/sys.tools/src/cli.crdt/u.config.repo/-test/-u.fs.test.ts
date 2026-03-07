import { describe, expect, Fs, it } from '../../../-test.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import { CrdtReposFs } from '../u.fs.ts';

describe('CrdtReposFs', () => {
  it('writeDoc + readYaml roundtrip', async () => {
    await withTmpDir(async (cwd) => {
      const path = Fs.join(cwd, CrdtReposFs.file());
      await CrdtReposFs.writeDoc(path, {
        sync: [{ endpoint: 'sync.example.com', enabled: true }],
        ports: { repo: 49494, sync: 3030 },
      });
      const res = await CrdtReposFs.readYaml(path);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.doc).to.eql({
          sync: [{ endpoint: 'sync.example.com', enabled: true }],
          ports: { repo: 49494, sync: 3030 },
        });
      }
    });
  });

  it('loadSync returns enabled endpoints', async () => {
    await withTmpDir(async (cwd) => {
      const path = Fs.join(cwd, CrdtReposFs.file());
      await CrdtReposFs.writeDoc(path, {
        sync: [{ endpoint: 'localhost:3030', enabled: false }, { endpoint: 'sync.example.com' }],
        ports: { repo: 49494, sync: 3030 },
      });
      const sync = await CrdtReposFs.loadSync(cwd);
      expect(sync).to.eql(['sync.example.com']);
    });
  });

  it('loadPorts uses defaults when missing', async () => {
    await withTmpDir(async (cwd) => {
      const ports = await CrdtReposFs.loadPorts(cwd);
      expect(ports).to.eql({ repo: 49494, sync: 3030 });
    });
  });
});
