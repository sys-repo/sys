import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { resolveBundleForPull } from '../u.defaults.ts';

describe('cli.pull/u.bundle → defaults', () => {
  it('uses defaults.local.clear when bundle local.clear is undefined', () => {
    const bundle: t.PullTool.ConfigYaml.Bundle = {
      kind: 'http',
      dist: 'https://example.com/dist.json',
      local: { dir: 'dev' },
    };

    const result = resolveBundleForPull(bundle, { local: { clear: true } });
    expect(result.local.clear).to.eql(true);
  });

  it('bundle local.clear=false overrides defaults.local.clear=true', () => {
    const bundle: t.PullTool.ConfigYaml.Bundle = {
      kind: 'http',
      dist: 'https://example.com/dist.json',
      local: { dir: 'dev', clear: false },
    };

    const result = resolveBundleForPull(bundle, { local: { clear: true } });
    expect(result.local.clear).to.eql(false);
  });

  it('falls back to false when no bundle/default clear is provided', () => {
    const bundle: t.PullTool.ConfigYaml.Bundle = {
      kind: 'github:release',
      repo: 'owner/name',
      local: { dir: 'releases' },
    };

    const result = resolveBundleForPull(bundle);
    expect(result.local.clear).to.eql(false);
  });
});
