import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { pullRemoteBundle } from '../u.pull/mod.ts';

describe('cli.pull/u.bundle → kind dispatch', () => {
  it('dispatches http bundles to the http puller', async () => {
    let called = false;
    const bundle: t.PullTool.ConfigYaml.HttpBundle = {
      kind: 'http',
      dist: 'https://example.com/dist.json',
      local: { dir: 'dev' },
    };

    await pullRemoteBundle('/tmp' as t.StringDir, bundle, {
      pullHttp() {
        called = true;
        return Promise.resolve({
          ok: true,
          data: { ok: true, ops: [], dist: {} } as unknown as t.PullToolBundleResult,
        });
      },
      pullGithubRelease() {
        throw new Error('should not call github:release puller');
      },
      pullGithubRepo() {
        throw new Error('should not call github:repo puller');
      },
    });

    expect(called).to.eql(true);
  });

  it('dispatches github:release bundles to the github puller', async () => {
    let called = false;
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/name',
      local: { dir: 'dev' },
    };

    await pullRemoteBundle('/tmp' as t.StringDir, bundle, {
      pullHttp() {
        throw new Error('should not call http puller');
      },
      pullGithubRelease() {
        called = true;
        return Promise.resolve({
          ok: true,
          data: { ok: true, ops: [], dist: {} } as unknown as t.PullToolBundleResult,
        });
      },
      pullGithubRepo() {
        throw new Error('should not call github:repo puller');
      },
    });

    expect(called).to.eql(true);
  });

  it('dispatches github:repo bundles to the github repo puller', async () => {
    let called = false;
    const bundle: t.PullTool.ConfigYaml.GithubRepoBundle = {
      kind: 'github:repo',
      repo: 'owner/name',
      local: { dir: 'dev' },
    };

    await pullRemoteBundle('/tmp' as t.StringDir, bundle, {
      pullHttp() {
        throw new Error('should not call http puller');
      },
      pullGithubRelease() {
        throw new Error('should not call github:release puller');
      },
      pullGithubRepo() {
        called = true;
        return Promise.resolve({
          ok: true,
          data: { ok: true, ops: [] } as unknown as t.PullToolBundleResult,
        });
      },
    });

    expect(called).to.eql(true);
  });
});
