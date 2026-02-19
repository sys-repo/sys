import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { pullRemoteBundle } from '../u.pull.ts';

describe('cli.pull/u.bundle → kind dispatch', () => {
  it('dispatches http bundles to the http puller', async () => {
    let called = false;
    const bundle: t.PullTool.ConfigYaml.HttpBundle = {
      kind: 'http',
      dist: 'https://example.com/dist.json',
      local: { dir: 'dev' },
    };

    await pullRemoteBundle('/tmp' as t.StringDir, bundle, {
      async pullHttp() {
        called = true;
        return {
          ok: true,
          data: { ok: true, ops: [], dist: {} } as unknown as t.PullToolBundleResult,
        };
      },
      async pullGithubRelease() {
        throw new Error('should not call github:release puller');
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
      async pullHttp() {
        throw new Error('should not call http puller');
      },
      async pullGithubRelease() {
        called = true;
        return {
          ok: true,
          data: { ok: true, ops: [], dist: {} } as unknown as t.PullToolBundleResult,
        };
      },
    });

    expect(called).to.eql(true);
  });
});
