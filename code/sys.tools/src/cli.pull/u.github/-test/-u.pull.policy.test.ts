import { describe, expect, Fs, it, type t, Time } from '../../../-test.ts';
import { GithubPull } from '../u.pull.ts';
import {
  abortablePending,
  json,
  LIMITS,
  release,
  usingGithubFetch,
  withTmpDir,
} from './u.pull.fixture.ts';

describe('GithubPull policy', () => {
  it('rejects every absent, non-positive, fractional, or non-finite limit before transport', async () => {
    await withTmpDir(async (root) => {
      let calls = 0;
      await usingGithubFetch(() => {
        calls++;
        return json(release([{ id: 1, name: 'a', body: 'a' }]));
      }, async () => {
        const invalid = [undefined, 0, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY];
        for (const key of Object.keys(LIMITS) as Array<keyof t.GithubPull.Limits>) {
          for (const value of invalid) {
            const result = await GithubPull.release({
              repo: 'owner/repo',
              into: Fs.join(root, `${key}-${String(value)}`) as t.StringDir,
              mode: 'create',
              limits: { ...LIMITS, [key]: value } as t.GithubPull.Limits,
            });
            expect(result.ok).to.eql(false);
            if (!result.ok) expect(result.kind).to.eql('invalid-input');
          }
        }
      });
      expect(calls).to.eql(0);
    });
  });

  it('rejects dot-segment source selectors before transport', async () => {
    await withTmpDir(async (root) => {
      let calls = 0;
      await usingGithubFetch(() => {
        calls++;
        return new Response('unexpected');
      }, async () => {
        const releaseResult = await GithubPull.release({
          repo: 'owner/repo',
          tag: '..',
          into: Fs.join(root, 'release') as t.StringDir,
          mode: 'create',
          limits: LIMITS,
        });
        const repoResult = await GithubPull.repo({
          repo: 'owner/repo',
          ref: '.',
          into: Fs.join(root, 'repo') as t.StringDir,
          mode: 'create',
          limits: LIMITS,
        });
        expect(releaseResult.ok).to.eql(false);
        expect(repoResult.ok).to.eql(false);
        if (!releaseResult.ok) expect(releaseResult.kind).to.eql('invalid-input');
        if (!repoResult.ok) expect(repoResult.kind).to.eql('invalid-input');
      });
      expect(calls).to.eql(0);
    });
  });

  it('enforces metadata and entry limits before target mutation', async () => {
    await withTmpDir(async (root) => {
      const metadata = release([
        { id: 1, name: 'a.txt', body: 'a' },
        { id: 2, name: 'b.txt', body: 'b' },
      ]);
      let downloads = 0;
      await usingGithubFetch((call) => {
        if (call.url.pathname.includes('/releases/assets/')) downloads++;
        return json(metadata);
      }, async () => {
        const metadataBound = await GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'metadata') as t.StringDir,
          mode: 'create',
          limits: { ...LIMITS, metadataBytes: 8 },
        });
        const entryBound = await GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'entries') as t.StringDir,
          mode: 'create',
          limits: { ...LIMITS, entries: 1 },
        });
        const knownBytesBound = await GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'known-bytes') as t.StringDir,
          mode: 'create',
          limits: { ...LIMITS, fileBytes: 1, totalBytes: 1 },
        });

        expect(metadataBound.ok).to.eql(false);
        if (!metadataBound.ok) expect(metadataBound.kind).to.eql('limit-exceeded');
        expect(entryBound.ok).to.eql(false);
        if (!entryBound.ok) expect(entryBound.kind).to.eql('limit-exceeded');
        expect(knownBytesBound.ok).to.eql(false);
        if (!knownBytesBound.ok) expect(knownBytesBound.kind).to.eql('limit-exceeded');
        expect(await Fs.exists(Fs.join(root, 'metadata'))).to.eql(false);
        expect(await Fs.exists(Fs.join(root, 'entries'))).to.eql(false);
        expect(await Fs.exists(Fs.join(root, 'known-bytes'))).to.eql(false);
        expect(downloads).to.eql(0);
      });
    });
  });

  it('enforces per-file and aggregate byte limits while reading bodies', async () => {
    await withTmpDir(async (root) => {
      const metadata = {
        tag_name: 'v1',
        assets: [
          { id: 1, name: 'a.txt' },
          { id: 2, name: 'b.txt' },
        ],
      };
      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) return json(metadata);
        if (call.url.pathname.endsWith('/releases/assets/1')) return new Response('aaa');
        if (call.url.pathname.endsWith('/releases/assets/2')) return new Response('bbb');
        return new Response('not found', { status: 404 });
      }, async () => {
        const fileBound = await GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'file') as t.StringDir,
          mode: 'create',
          limits: { ...LIMITS, fileBytes: 2 },
        });
        expect(fileBound.ok).to.eql(false);
        if (!fileBound.ok) expect(fileBound.kind).to.eql('limit-exceeded');

        const aggregate = await GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'aggregate') as t.StringDir,
          mode: 'create',
          limits: { ...LIMITS, fileBytes: 5, totalBytes: 5 },
        });
        expect(aggregate.ok).to.eql(false);
        if (!aggregate.ok) {
          expect(aggregate.kind).to.eql('limit-exceeded');
          expect(aggregate.files.map((file) => file.target)).to.eql(['a.txt']);
        }
        expect((await Fs.readText(Fs.join(root, 'aggregate/a.txt'))).data).to.eql('aaa');
        expect(await Fs.exists(Fs.join(root, 'aggregate/b.txt'))).to.eql(false);
      });
    });
  });

  it('enforces total time and caller cancellation', async () => {
    await withTmpDir(async (root) => {
      await usingGithubFetch((call) => abortablePending(call.signal), async () => {
        const timedOut = await GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'timeout') as t.StringDir,
          mode: 'create',
          limits: { ...LIMITS, totalTime: 10 },
        });
        expect(timedOut.ok).to.eql(false);
        if (!timedOut.ok) expect(timedOut.kind).to.eql('limit-exceeded');

        const controller = new AbortController();
        const pending = GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'cancelled') as t.StringDir,
          mode: 'create',
          limits: LIMITS,
          until: controller.signal,
        });
        controller.abort('caller');
        const cancelled = await pending;
        expect(cancelled.ok).to.eql(false);
        if (!cancelled.ok) expect(cancelled.kind).to.eql('cancelled');

        const longController = new AbortController();
        const longPending = GithubPull.release({
          repo: 'owner/repo',
          into: Fs.join(root, 'long-cancelled') as t.StringDir,
          mode: 'create',
          limits: { ...LIMITS, totalTime: Number.MAX_SAFE_INTEGER },
          until: longController.signal,
        });
        await Time.delay(5);
        longController.abort('caller');
        const longCancelled = await longPending;
        expect(longCancelled.ok).to.eql(false);
        if (!longCancelled.ok) expect(longCancelled.kind).to.eql('cancelled');
      });
    });
  });

  it('preserves committed files when later work is cancelled', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'cancelled-partial') as t.StringDir;
      const metadata = release([
        { id: 1, name: 'a.txt', body: 'a' },
        { id: 2, name: 'b.txt', body: 'b' },
      ]);
      let markSecondStarted!: () => void;
      const secondStarted = new Promise<void>((resolve) => {
        markSecondStarted = resolve;
      });

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) return json(metadata);
        if (call.url.pathname.endsWith('/releases/assets/1')) return new Response('a');
        if (call.url.pathname.endsWith('/releases/assets/2')) {
          markSecondStarted();
          return abortablePending(call.signal);
        }
        return new Response('not found', { status: 404 });
      }, async () => {
        const controller = new AbortController();
        const pending = GithubPull.release({
          repo: 'owner/repo',
          into,
          mode: 'create',
          limits: LIMITS,
          until: controller.signal,
        });
        await secondStarted;
        controller.abort('caller');

        const result = await pending;
        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.kind).to.eql('cancelled');
          expect(result.files.map((file) => file.target)).to.eql(['a.txt']);
        }
        expect((await Fs.readText(Fs.join(into, 'a.txt'))).data).to.eql('a');
        expect(await Fs.exists(Fs.join(into, 'b.txt'))).to.eql(false);
      });
    });
  });

  it('rejects unsafe and colliding release targets before download', async () => {
    await withTmpDir(async (root) => {
      let downloads = 0;
      const cases = [
        {
          tag_name: 'v1',
          assets: [{ id: 1, name: '../evil.txt', size: 1 }],
        },
        {
          tag_name: 'v1',
          assets: [
            { id: 1, name: 'same.txt', size: 1 },
            { id: 2, name: 'same.txt', size: 1 },
          ],
        },
      ];

      await usingGithubFetch((call) => {
        if (call.url.pathname.includes('/releases/assets/')) downloads++;
        return json(cases.shift());
      }, async () => {
        for (const name of ['unsafe', 'collision']) {
          const into = Fs.join(root, name) as t.StringDir;
          const result = await GithubPull.release({
            repo: 'owner/repo',
            into,
            mode: 'create',
            limits: LIMITS,
          });
          expect(result.ok).to.eql(false);
          if (!result.ok) expect(result.kind).to.eql('unsafe-target');
          expect(await Fs.exists(into)).to.eql(false);
        }
      });
      expect(downloads).to.eql(0);
    });
  });

  it('preserves published-file truth after a later source failure and sanitizes errors', async () => {
    await withTmpDir(async (root) => {
      const into = Fs.join(root, 'partial') as t.StringDir;
      const token = 'github_pat_123456789012345678901234';
      const metadata = release([
        { id: 1, name: 'a.txt', body: 'a' },
        { id: 2, name: 'b.txt', body: 'b' },
      ]);

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) return json(metadata);
        if (call.url.pathname.endsWith('/releases/assets/1')) return new Response('a');
        if (call.url.pathname.endsWith('/releases/assets/2')) {
          throw new Error(`transport failed with Bearer ${token}`);
        }
        return new Response('not found', { status: 404 });
      }, async () => {
        const result = await GithubPull.release({
          repo: 'owner/repo',
          into,
          mode: 'create',
          limits: LIMITS,
          token,
        });

        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.kind).to.eql('source-failure');
          expect(result.files).to.eql([{
            source: 'https://api.github.com/repos/owner/repo/releases/assets/1',
            target: 'a.txt',
            bytes: 1,
          }]);
          expect(result.error.includes(token)).to.eql(false);
          expect(result.error.includes('Bearer')).to.eql(false);
        }
        expect((await Fs.readText(Fs.join(into, 'a.txt'))).data).to.eql('a');
        expect(await Fs.exists(Fs.join(into, 'b.txt'))).to.eql(false);
      });
    });
  });
});
