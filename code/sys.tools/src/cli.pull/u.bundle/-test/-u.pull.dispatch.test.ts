import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../../common.ts';
import { pullRemoteBundle } from '../u.pull/mod.ts';

const LIMITS: t.GithubPull.Limits = {
  metadataBytes: 1000,
  entries: 10,
  fileBytes: 1000,
  totalBytes: 1000,
  totalTime: 1000,
};

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
        return Promise.resolve({ ok: true, data: { ok: true, ops: [] } });
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

  it('dispatches github:release bundles to the public result path', async () => {
    let called = false;
    const bundle: t.PullTool.ConfigYaml.GithubReleaseBundle = {
      kind: 'github:release',
      repo: 'owner/name',
      local: { dir: 'dev', mode: 'create' },
      limits: LIMITS,
    };

    const result = await pullRemoteBundle('/tmp' as t.StringDir, bundle, {
      pullHttp() {
        throw new Error('should not call http puller');
      },
      pullGithubRelease() {
        called = true;
        return Promise.resolve(releaseSuccess());
      },
      pullGithubRepo() {
        throw new Error('should not call github:repo puller');
      },
    });

    expect(called).to.eql(true);
    expect(result).to.eql(releaseSuccess());
  });

  it('dispatches github:repo bundles to the public result path', async () => {
    let called = false;
    const bundle: t.PullTool.ConfigYaml.GithubRepoBundle = {
      kind: 'github:repo',
      repo: 'owner/name',
      local: { dir: 'dev', mode: 'replace' },
      limits: LIMITS,
    };

    const result = await pullRemoteBundle('/tmp' as t.StringDir, bundle, {
      pullHttp() {
        throw new Error('should not call http puller');
      },
      pullGithubRelease() {
        throw new Error('should not call github:release puller');
      },
      pullGithubRepo() {
        called = true;
        return Promise.resolve(repoSuccess());
      },
    });

    expect(called).to.eql(true);
    expect(result).to.eql(repoSuccess());
  });
});

function releaseSuccess(): t.GithubPull.Success {
  return {
    ok: true,
    into: '/tmp/dev' as t.StringAbsoluteDir,
    resolved: { kind: 'github:release', repo: 'owner/name', tag: 'v1', assets: [] },
    files: [],
  };
}

function repoSuccess(): t.GithubPull.Success {
  return {
    ok: true,
    into: '/tmp/dev' as t.StringAbsoluteDir,
    resolved: {
      kind: 'github:repo',
      repo: 'owner/name',
      ref: 'main',
      commit: 'commit',
      tree: 'tree',
    },
    files: [],
  };
}
