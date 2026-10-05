import { describe, expect, Fs, it, type t } from '../../../-test.ts';
import { GithubPull } from '../u.pull.ts';
import { json, LIMITS, usingGithubFetch, withTmpDir } from './u.pull.fixture.ts';

describe('GithubPull.repo', () => {
  it('resolves the default branch and publishes one bounded repository subtree', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'repo') as t.StringDir;
      await usingGithubFetch((call) =>
        routeRepo(call, {
          'sha-mod': 'export const value = 1;\n',
        }), async () => {
        const result = await GithubPull.repo({
          repo: 'owner/repo',
          path: 'packages/tooling',
          into,
          mode: 'create',
          limits: LIMITS,
        });

        expect(result.ok).to.eql(true);
        if (!result.ok) return;
        expect(result.resolved).to.eql({
          kind: 'github:repo',
          repo: 'owner/repo',
          ref: 'main',
          commit: 'commit-sha',
          tree: 'tree-sha',
          path: 'packages/tooling',
        });
        expect(result.files).to.eql([{
          source: 'https://api.github.com/repos/owner/repo/git/blobs/sha-mod',
          target: 'mod.ts',
          bytes: 24,
        }]);
        expect((await Fs.readText(Fs.join(into, 'mod.ts'))).data).to.eql(
          'export const value = 1;\n',
        );
        expect(await Fs.exists(Fs.join(into, 'dist.json'))).to.eql(false);
      });
    });
  });

  it('sanitizes hostile repository metadata failures', async () => {
    await withTmpDir(async (root) => {
      const hostile = 'private\nmetadata';
      await usingGithubFetch((call) => {
        const path = call.url.pathname;
        if (path.endsWith('/commits/main')) {
          return json({ sha: 'commit-sha', commit: { tree: { sha: 'tree-sha' } } });
        }
        if (path.endsWith('/git/trees/tree-sha')) {
          return json({
            sha: 'tree-sha',
            truncated: false,
            tree: [{ path: hostile, type: 'blob', mode: '100644', sha: 'sha-hostile' }],
          });
        }
        return new Response('not found', { status: 404 });
      }, async () => {
        const result = await GithubPull.repo({
          repo: 'owner/repo',
          ref: 'main',
          into: Fs.join(root, 'repo') as t.StringDir,
          mode: 'create',
          limits: LIMITS,
        });
        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.error).to.eql('GitHub repository source is not materializable.');
          expect(result.error.includes(hostile)).to.eql(false);
        }
      });
    });
  });

  it('rejects incomplete or unsupported tree metadata before target mutation', async () => {
    await withTmpDir(async (root) => {
      const trees = [
        {
          sha: 'tree-sha',
          tree: [{ path: 'mod.ts', type: 'blob', mode: '100644', sha: 'sha-mod' }],
        },
        {
          sha: 'tree-sha',
          truncated: false,
          tree: [{ path: 'mod.ts', type: 'blob', mode: '100600', sha: 'sha-mod' }],
        },
      ];
      let downloads = 0;

      await usingGithubFetch((call) => {
        const path = call.url.pathname;
        if (path.endsWith('/commits/main')) {
          return json({ sha: 'commit-sha', commit: { tree: { sha: 'tree-sha' } } });
        }
        if (path.endsWith('/git/trees/tree-sha')) return json(trees.shift());
        if (path.includes('/git/blobs/')) downloads++;
        return new Response('not found', { status: 404 });
      }, async () => {
        for (const name of ['incomplete', 'unsupported']) {
          const into = Fs.join(root, name) as t.StringDir;
          const result = await GithubPull.repo({
            repo: 'owner/repo',
            ref: 'main',
            into,
            mode: 'create',
            limits: LIMITS,
          });
          expect(result.ok).to.eql(false);
          if (!result.ok) expect(result.kind).to.eql('source-failure');
          expect(await Fs.exists(into)).to.eql(false);
        }
      });
      expect(downloads).to.eql(0);
    });
  });

  it('rejects symlinked output ancestry before downloading files', async () => {
    await withTmpDir(async (root) => {
      const outside = Fs.join(root, 'outside');
      const link = Fs.join(root, 'linked');
      await Fs.ensureDir(outside);
      await Deno.symlink(outside, link, { type: 'dir' });
      let downloads = 0;

      await usingGithubFetch((call) => {
        if (call.url.pathname.includes('/git/blobs/')) downloads++;
        return routeRepo(call, { 'sha-mod': 'code' });
      }, async () => {
        const result = await GithubPull.repo({
          repo: 'owner/repo',
          ref: 'main',
          path: 'packages/tooling',
          into: Fs.join(link, 'missing/repo') as t.StringDir,
          mode: 'create',
          limits: LIMITS,
        });

        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.kind).to.eql('unsafe-target');
        expect(downloads).to.eql(0);
        expect(await Fs.exists(Fs.join(outside, 'missing'))).to.eql(false);
      });
    });
  });
});

function routeRepo(call: { url: URL }, blobs: Readonly<Record<string, string>>): Response {
  const path = call.url.pathname;
  if (path === '/repos/owner/repo') return json({ default_branch: 'main' });
  if (path.endsWith('/commits/main')) {
    return json({ sha: 'commit-sha', commit: { tree: { sha: 'tree-sha' } } });
  }
  if (path.endsWith('/git/trees/tree-sha')) {
    const body = blobs['sha-mod'] ?? '';
    return json({
      sha: 'tree-sha',
      truncated: false,
      tree: [
        { path: 'packages', type: 'tree', mode: '040000', sha: 'tree-packages' },
        {
          path: 'packages/tooling',
          type: 'tree',
          mode: '040000',
          sha: 'tree-tooling',
        },
        {
          path: 'packages/tooling/mod.ts',
          type: 'blob',
          mode: '100644',
          sha: 'sha-mod',
          size: new TextEncoder().encode(body).byteLength,
        },
      ],
    });
  }
  const sha = path.split('/').at(-1) ?? '';
  if (path.includes('/git/blobs/') && sha in blobs) return new Response(blobs[sha]);
  return new Response('not found', { status: 404 });
}
