import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../../common.ts';
import { validateBundleIsolation } from '../u.isolation.ts';

const PIN: t.DistPin = { scheme: 'sys.dist/v2', digest: `sha256-${'a'.repeat(64)}` };
const LIMITS: t.GithubPull.Limits = {
  metadataBytes: 1000,
  entries: 10,
  fileBytes: 1000,
  totalBytes: 1000,
  totalTime: 1000,
};

describe('cli.pull/u.bundle → filesystem authority isolation', () => {
  it('allows Dist bundles to share one sealed store', () => {
    const result = validateBundleIsolation(location([
      dist('https://example.com/a/dist.json', PIN),
      dist('https://example.com/b/dist.json', { ...PIN, digest: `sha256-${'b'.repeat(64)}` }),
    ]));

    expect(result).to.eql({ ok: true });
  });

  it('rejects projection overlap with sealed stores', () => {
    const bundle = {
      ...dist('https://example.com/dist.json', PIN),
      project: { dir: '.dist-store/project' as t.StringRelativeDir, mode: 'replace' as const },
    };

    const result = validateBundleIsolation(location([bundle]));
    expect(result.ok).to.eql(false);
    if (!result.ok) expect(result.error).to.include('filesystem authorities overlap');
  });

  it('rejects cross-bundle mutable overlap before execution', () => {
    const bundle = {
      ...dist('https://example.com/dist.json', PIN),
      project: { dir: 'view/app' as t.StringRelativeDir, mode: 'replace' as const },
    };
    const github: t.PullTool.ConfigYaml.GithubRepoBundle = {
      kind: 'github:repo',
      repo: 'owner/repo',
      local: { dir: 'view' as t.StringRelativeDir, mode: 'replace' },
      limits: LIMITS,
    };

    const result = validateBundleIsolation(location([bundle, github]));
    expect(result.ok).to.eql(false);
  });

  it('rejects relative aliases even when runtime input bypasses YAML schema', () => {
    const bundle = {
      ...dist('https://example.com/dist.json', PIN),
      store: 'nested/./store' as t.StringRelativeDir,
    };

    const result = validateBundleIsolation(location([bundle]));
    expect(result.ok).to.eql(false);
  });
});

function dist(
  manifest: string,
  pin: t.DistPin,
): t.PullTool.ConfigYaml.DistBundle {
  return {
    kind: 'dist',
    manifest: manifest as t.StringUrl,
    pin,
    store: '.dist-store',
  };
}

function location(
  bundles: t.PullTool.ConfigYaml.Bundle[],
): t.PullTool.ConfigYaml.Location {
  return { dir: '/tmp/pull-root' as t.StringDir, bundles };
}
