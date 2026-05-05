import { Cli, describe, expect, it } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { formatBundleOptionLocalDirWidth, formatBundleOptionName } from '../u.bundle.ts';

describe('cli.pull/u.bundle → menu labels', () => {
  it('renders bundle local dirs as rooted relative targets', () => {
    const bundles: t.PullTool.ConfigYaml.Bundle[] = [
      {
        kind: 'http',
        dist: 'https://fs.db.team/dist.json' as t.StringUrl,
        local: { dir: 'dev' as t.StringRelativeDir },
      },
      {
        kind: 'github:repo',
        repo: 'sys-repo/sys.canon',
        local: { dir: 'canon' as t.StringRelativeDir },
      },
    ];

    const width = formatBundleOptionLocalDirWidth(bundles);
    const names = bundles.map((bundle, index, all) => {
      return Cli.stripAnsi(formatBundleOptionName(bundle, index, all, width));
    });

    expect(names[0]).to.contain('pull: ├─ ./dev');
    expect(names[1]).to.contain('pull: └─ ./canon');
  });

  it('keeps local-dir alignment width rooted to the displayed ./ label', () => {
    const bundles: t.PullTool.ConfigYaml.Bundle[] = [
      {
        kind: 'http',
        dist: 'https://fs.db.team/dist.json' as t.StringUrl,
        local: { dir: 'dev' as t.StringRelativeDir },
      },
      {
        kind: 'http',
        dist: 'https://slc.db.team/dist.json' as t.StringUrl,
        local: { dir: './slc.db.team' as t.StringRelativeDir },
      },
    ];

    const width = formatBundleOptionLocalDirWidth(bundles);
    const names = bundles.map((bundle, index, all) => {
      return Cli.stripAnsi(formatBundleOptionName(bundle, index, all, width));
    });

    expect(width).to.eql('./slc.db.team'.length);
    expect(names[0]).to.contain('./dev         ← fs.db.team/dist.json');
    expect(names[1]).to.contain('./slc.db.team ← slc.db.team/dist.json');
    expect(names[1]).to.not.contain('././slc.db.team');
  });

  it('does not trim local-dir whitespace while rendering the rooted label', () => {
    const bundles: t.PullTool.ConfigYaml.Bundle[] = [
      {
        kind: 'http',
        dist: 'https://fs.db.team/dist.json' as t.StringUrl,
        local: { dir: 'dev ' as t.StringRelativeDir },
      },
    ];

    const width = formatBundleOptionLocalDirWidth(bundles);
    const name = Cli.stripAnsi(formatBundleOptionName(bundles[0], 0, bundles, width));

    expect(width).to.eql('./dev '.length);
    expect(name).to.contain('./dev  ← fs.db.team/dist.json');
  });
});
