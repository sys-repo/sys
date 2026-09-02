import { Cli, describe, expect, it } from '../../../-test.ts';
import type { t } from '../../common.ts';
import { formatBundleOptionLocalDirWidth, formatBundleOptionName } from '../u.bundle.ts';

const LIMITS: t.GithubPull.Limits = {
  metadataBytes: 1_000_000,
  entries: 100,
  fileBytes: 10_000_000,
  totalBytes: 50_000_000,
  totalTime: 30_000,
};

const INTEGRITY = `sha256-${'a'.repeat(64)}` as t.StringHash;

describe('cli.pull/u.bundle → menu labels', () => {
  it('renders bundle mutable targets as rooted relative paths', () => {
    const bundles: t.PullTool.ConfigYaml.Bundle[] = [
      distBundle('https://files.example/dist.json', 'dev'),
      {
        kind: 'github:repo',
        repo: 'sample/repository',
        local: { dir: 'canon' as t.StringRelativeDir, mode: 'create' },
        limits: LIMITS,
      },
    ];

    const width = formatBundleOptionLocalDirWidth(bundles);
    const names = bundles.map((bundle, index, all) => {
      return Cli.stripAnsi(formatBundleOptionName(bundle, index, all, width));
    });

    expect(names[0]).to.contain('pull: ├─ ./dev');
    expect(names[1]).to.contain('pull: └─ ./canon');
  });

  it('uses the sealed store target when no projection is configured', () => {
    const bundle: t.PullTool.ConfigYaml.DistBundle = {
      kind: 'dist',
      manifest: 'https://files.example/dist.json',
      integrity: INTEGRITY,
      store: './.dist-store',
    };

    const name = Cli.stripAnsi(formatBundleOptionName(bundle, 0, [bundle]));
    expect(name).to.contain('./.dist-store ← files.example/dist.json');
  });

  it('keeps target alignment width rooted to the displayed ./ label', () => {
    const bundles: t.PullTool.ConfigYaml.Bundle[] = [
      distBundle('https://files.example/dist.json', 'dev'),
      distBundle('https://sample.example/dist.json', './sample.site'),
    ];

    const width = formatBundleOptionLocalDirWidth(bundles);
    const names = bundles.map((bundle, index, all) => {
      return Cli.stripAnsi(formatBundleOptionName(bundle, index, all, width));
    });

    expect(width).to.eql('./sample.site'.length);
    expect(names[0]).to.contain('./dev         ← files.example/dist.json');
    expect(names[1]).to.contain('./sample.site ← sample.example/dist.json');
    expect(names[1]).to.not.contain('././sample.site');
  });

  it('does not trim target whitespace while rendering the rooted label', () => {
    const bundles: t.PullTool.ConfigYaml.Bundle[] = [
      distBundle('https://files.example/dist.json', 'dev '),
    ];

    const width = formatBundleOptionLocalDirWidth(bundles);
    const name = Cli.stripAnsi(formatBundleOptionName(bundles[0], 0, bundles, width));

    expect(width).to.eql('./dev '.length);
    expect(name).to.contain('./dev  ← files.example/dist.json');
  });
});

function distBundle(manifest: string, project: string): t.PullTool.ConfigYaml.DistBundle {
  return {
    kind: 'dist',
    manifest: manifest as t.StringUrl,
    integrity: INTEGRITY,
    store: './.dist-store',
    project: { dir: project as t.StringRelativeDir, mode: 'replace' },
  };
}
