import { describe, expect, Fs, it } from '../../../-test.ts';
import { executeGithubPullPlan } from '../u.pull/u.github.execute.ts';
import { type t } from '../u.pull/common.ts';

describe('cli.pull/u.bundle → github pull executor', () => {
  it('writes planned entries under the target root and records ops', async () => {
    await withTmpDir(async (baseDir) => {
      const targetRoot = Fs.join(baseDir, 'target') as t.StringDir;
      const plan = releasePlan(targetRoot, [entry(1, 'a.txt'), entry(2, 'nested/b.txt')]);

      const res = await executeGithubPullPlan({
        baseDir,
        plan,
        download: async (request) => bytes(`asset-${request.assetId}`),
      });

      expect(res.ok).to.eql(true);
      expect(res.ops.map((op) => op.path.target)).to.eql([
        Fs.join(targetRoot, 'a.txt'),
        Fs.join(targetRoot, 'nested/b.txt'),
      ]);
      expect(res.ops.map((op) => op.bytes)).to.eql([7, 7]);
      expect((await Fs.readText(Fs.join(targetRoot, 'a.txt'))).data).to.eql('asset-1');
      expect((await Fs.readText(Fs.join(targetRoot, 'nested/b.txt'))).data).to.eql('asset-2');
    });
  });

  it('preflights invalid entry paths before clearing the target', async () => {
    await withTmpDir(async (baseDir) => {
      const targetRoot = Fs.join(baseDir, 'target') as t.StringDir;
      const keepPath = Fs.join(targetRoot, 'keep.txt');
      await Fs.ensureDir(targetRoot);
      await Fs.write(keepPath, 'keep', { force: true });

      let called = false;
      const res = await executeGithubPullPlan({
        baseDir,
        plan: releasePlan(targetRoot, [entry(1, '../evil.txt')]),
        clear: true,
        download: async () => {
          called = true;
          return bytes('nope');
        },
      });

      expect(res.ok).to.eql(false);
      expect(called).to.eql(false);
      expect(await Fs.exists(keepPath)).to.eql(true);
      expect((await Fs.readText(keepPath)).data).to.eql('keep');
    });
  });

  it('continues after entry download failures and returns a release failure summary', async () => {
    await withTmpDir(async (baseDir) => {
      const targetRoot = Fs.join(baseDir, 'target') as t.StringDir;
      const res = await executeGithubPullPlan({
        baseDir,
        plan: releasePlan(targetRoot, [entry(1, 'a.txt'), entry(2, 'b.txt'), entry(3, 'c.txt')]),
        download: async (request) => {
          if (request.assetId === 2) throw new Error('download failed');
          return bytes(`asset-${request.assetId}`);
        },
      });

      expect(res.ok).to.eql(false);
      expect(res.ops.map((op) => op.ok)).to.eql([true, false, true]);
      if (res.ok) return;
      expect(res.error).to.include('release pull failed (1/3 assets)');
      expect(res.error).to.include('download failed');
      expect((await Fs.readText(Fs.join(targetRoot, 'a.txt'))).data).to.eql('asset-1');
      expect(await Fs.exists(Fs.join(targetRoot, 'b.txt'))).to.eql(false);
      expect((await Fs.readText(Fs.join(targetRoot, 'c.txt'))).data).to.eql('asset-3');
    });
  });

  it('rejects target roots outside or equal to the base directory', async () => {
    await withTmpDir(async (baseDir) => {
      const outside = Fs.join(Fs.dirname(baseDir), 'outside') as t.StringDir;
      const outsideRes = await executeGithubPullPlan({
        baseDir,
        plan: releasePlan(outside, [entry(1, 'a.txt')]),
        download: async () => bytes('nope'),
      });
      const equalRes = await executeGithubPullPlan({
        baseDir,
        plan: releasePlan(baseDir, [entry(1, 'a.txt')]),
        download: async () => bytes('nope'),
      });

      expect(outsideRes.ok).to.eql(false);
      expect(equalRes.ok).to.eql(false);
    });
  });

  it('rejects unsafe relative paths', async () => {
    await withTmpDir(async (baseDir) => {
      const targetRoot = Fs.join(baseDir, 'target') as t.StringDir;
      const paths = [
        '../evil.txt',
        '/absolute.txt',
        'C:/evil.txt',
        '',
        './file.txt',
        'nested/../evil.txt',
      ];

      for (const path of paths) {
        const res = await executeGithubPullPlan({
          baseDir,
          plan: releasePlan(targetRoot, [entry(1, path as t.StringRelativePath)]),
          download: async () => bytes('nope'),
        });
        expect(res.ok).to.eql(false);
      }
    });
  });
});

function releasePlan(
  targetRoot: t.StringDir,
  entries: readonly t.GithubPull.Entry[],
): t.GithubPull.Plan {
  return {
    kind: 'github:release',
    targetRoot,
    entries,
  };
}

function entry(assetId: number, relativePath: t.StringRelativePath): t.GithubPull.Entry {
  return {
    source: `https://example.com/${assetId}` as t.StringUrl,
    relativePath,
    request: {
      kind: 'release-asset',
      repo: 'owner/repo',
      assetId,
      fallbackUrl: `https://example.com/${assetId}` as t.StringUrl,
    },
  };
}

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

async function withTmpDir(fn: (dir: t.StringDir) => Promise<void>) {
  const dir = await Fs.makeTempDir({ prefix: 'sys.tools.pull.github.execute.' });
  try {
    await fn(dir.absolute as t.StringDir);
  } finally {
    await Fs.remove(dir.absolute);
  }
}
