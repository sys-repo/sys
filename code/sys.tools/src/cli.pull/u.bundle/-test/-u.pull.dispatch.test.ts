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

const INTEGRITY: t.StringHash = `sha256-${'a'.repeat(64)}`;
const RECEIVED: t.StringHash = `sha256-${'b'.repeat(64)}`;

describe('cli.pull/u.bundle → kind dispatch', () => {
  it('dispatches Dist bundles only to the pinned materializer', async () => {
    let called = false;
    const bundle: t.PullTool.ConfigYaml.DistBundle = {
      kind: 'dist',
      manifest: 'https://example.com/dist.json',
      integrity: INTEGRITY,
      store: './.dist-store',
    };
    const expected: t.PullTool.Bundle.Dist.MaterializationFailure = {
      ok: false,
      kind: 'materialization-failed',
      generation: {
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'integrity-mismatch',
        cleanup: 'not-needed',
        manifestChecksum: { expected: INTEGRITY, received: RECEIVED },
      },
      projection: { kind: 'not-run' },
    };

    const result = await pullRemoteBundle('/tmp' as t.StringDir, bundle, {
      pullDist() {
        called = true;
        return Promise.resolve(expected);
      },
      pullGithubRelease() {
        throw new Error('should not call github:release puller');
      },
      pullGithubRepo() {
        throw new Error('should not call github:repo puller');
      },
    });

    expect(called).to.eql(true);
    expect(result).to.eql(expected);
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
      pullDist() {
        throw new Error('should not call Dist materializer');
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
      pullDist() {
        throw new Error('should not call Dist materializer');
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
