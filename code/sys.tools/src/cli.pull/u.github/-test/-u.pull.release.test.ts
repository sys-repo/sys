import { describe, expect, Fs, it, type t } from '../../../-test.ts';
import { GithubPull } from '../u.pull.ts';
import { json, LIMITS, release, usingGithubFetch, withTmpDir } from './u.pull.fixture.ts';

describe('GithubPull.release', () => {
  it('publishes selected release assets as generic files without generating Dist metadata', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'release') as t.StringDir;
      const metadata = release([
        { id: 1, name: 'app.tgz', body: 'app' },
        { id: 2, name: 'notes.txt', body: 'notes' },
      ]);

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/tags/v1.2.3')) return json(metadata);
        if (call.url.pathname.endsWith('/releases/assets/2')) return new Response('notes');
        return new Response('not found', { status: 404 });
      }, async () => {
        const result = await GithubPull.release({
          repo: 'owner/repo',
          tag: 'v1.2.3',
          assets: ['notes.txt'],
          into,
          mode: 'create',
          limits: LIMITS,
        });

        expect(result.ok).to.eql(true);
        if (!result.ok) return;
        expect(result.resolved).to.eql({
          kind: 'github:release',
          repo: 'owner/repo',
          tag: 'v1.2.3',
          assets: ['notes.txt'],
        });
        expect(result.files).to.eql([{
          source: 'https://api.github.com/repos/owner/repo/releases/assets/2',
          target: 'notes.txt',
          bytes: 5,
        }]);
        expect((await Fs.readText(Fs.join(into, 'notes.txt'))).data).to.eql('notes');
        expect(await Fs.exists(Fs.join(into, 'dist.json'))).to.eql(false);
      });
    });
  });

  it('requires explicit create or replace target authority', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'release') as t.StringDir;
      await Fs.ensureDir(into);
      await Fs.write(Fs.join(into, 'keep.txt'), 'keep');
      const metadata = release([{ id: 1, name: 'app.tgz', body: 'app' }]);

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) return json(metadata);
        if (call.url.pathname.endsWith('/releases/assets/1')) return new Response('app');
        return new Response('not found', { status: 404 });
      }, async () => {
        const occupied = await GithubPull.release({
          repo: 'owner/repo',
          into,
          mode: 'create',
          limits: LIMITS,
        });
        expect(occupied.ok).to.eql(false);
        if (!occupied.ok) expect(occupied.kind).to.eql('target-occupied');
        expect((await Fs.readText(Fs.join(into, 'keep.txt'))).data).to.eql('keep');

        const replaced = await GithubPull.release({
          repo: 'owner/repo',
          into,
          mode: 'replace',
          limits: LIMITS,
        });
        expect(replaced.ok).to.eql(true);
        expect(await Fs.exists(Fs.join(into, 'keep.txt'))).to.eql(false);
        expect((await Fs.readText(Fs.join(into, 'app.tgz'))).data).to.eql('app');
      });
    });
  });

  it('permits one Rooted create winner across concurrent operations', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'concurrent-release') as t.StringDir;
      const metadata = release([{ id: 1, name: 'app.tgz', body: 'app' }]);

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) return json(metadata);
        if (call.url.pathname.endsWith('/releases/assets/1')) return new Response('app');
        return new Response('not found', { status: 404 });
      }, async () => {
        const input: t.GithubPull.ReleaseArgs = {
          repo: 'owner/repo',
          into,
          mode: 'create',
          limits: LIMITS,
        };
        const results = await Promise.all([
          GithubPull.release(input),
          GithubPull.release(input),
        ]);
        const successes = results.filter((result) => result.ok);
        const failures = results.filter((result) => !result.ok);

        expect(successes.length).to.eql(1);
        expect(failures.length).to.eql(1);
        expect(failures[0]?.kind).to.eql('target-occupied');
        expect((await Fs.readText(Fs.join(into, 'app.tgz'))).data).to.eql('app');
      });
    });
  });

  it('rejects redirects outside owner-fixed GitHub source origins', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'release') as t.StringDir;
      let reachedUntrustedOrigin = false;

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) {
          return json(release([{ id: 1, name: 'app.tgz', body: 'app' }]));
        }
        if (call.url.pathname.endsWith('/releases/assets/1')) {
          return new Response(null, {
            status: 302,
            headers: { location: 'https://untrusted.example/app.tgz' },
          });
        }
        if (call.url.origin === 'https://untrusted.example') reachedUntrustedOrigin = true;
        return new Response('app');
      }, async () => {
        const result = await GithubPull.release({
          repo: 'owner/repo',
          into,
          mode: 'create',
          limits: LIMITS,
        });
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.kind).to.eql('source-failure');
        expect(reachedUntrustedOrigin).to.eql(false);
        expect(await Fs.exists(Fs.join(into, 'app.tgz'))).to.eql(false);
      });
    });
  });

  it('confines tokens to the GitHub API origin across asset redirects', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'release') as t.StringDir;
      const token = 'github_pat_123456789012345678901234';
      const metadata = release([{ id: 1, name: 'app.tgz', body: 'app' }]);

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) return json(metadata);
        if (call.url.pathname.endsWith('/releases/assets/1')) {
          return new Response(null, {
            status: 302,
            headers: { location: 'https://objects.githubusercontent.com/app.tgz' },
          });
        }
        if (call.url.origin === 'https://objects.githubusercontent.com') return new Response('app');
        return new Response('not found', { status: 404 });
      }, async (calls) => {
        const result = await GithubPull.release({
          repo: 'owner/repo',
          into,
          mode: 'create',
          limits: LIMITS,
          token,
        });
        expect(result.ok).to.eql(true);

        const api = calls.filter((call) => call.url.origin === 'https://api.github.com');
        const redirected = calls.find((call) =>
          call.url.origin === 'https://objects.githubusercontent.com'
        );
        expect(api.every((call) => call.headers.get('authorization') === `Bearer ${token}`)).to.eql(
          true,
        );
        expect(redirected?.headers.get('authorization')).to.eql(null);
      });
    });
  });
});
