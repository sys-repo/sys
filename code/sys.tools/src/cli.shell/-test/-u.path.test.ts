import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { formatPathAdd, formatPathList } from '../u.fmt.ts';
import { pathAdd, pathList } from '../u.path.ts';

describe('cli.shell Path', () => {
  it('lists managed PATH state without profile content leakage', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await pathList({
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: `${home}/.deno/bin:/usr/bin` })[name],
      exists: async (path) => path === zshrc,
      readText: async () =>
        `secret before\n# >>> @sys/tools shell
# Managed by @sys/tools shell. Edit with: sys shell ...

# @sys.shell path deno
export DENO_INSTALL="\${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac

# <<< @sys/tools shell
secret after\n`,
    });
    const text = Cli.stripAnsi(formatPathList(report));

    expect(report.items.map((item) => [item.entry.label, item.state])).to.eql([[
      'deno',
      'enabled',
    ]]);
    expect(text).to.contain('system/shell:tools path list');
    expect(text).to.contain('deno enabled');
    expect(text).not.to.contain('secret before');
    expect(text).not.to.contain('secret after');
  });

  it('detects unmanaged Deno PATH profile entries as present', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await pathList({
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => 'export PATH="$HOME/.deno/bin:$PATH"\n',
    });

    expect(report.items.map((item) => [item.entry.label, item.state, item.unmanagedProfiles])).to
      .eql([['deno', 'present', [zshrc]]]);
  });

  it('plans PATH add as a dry-run managed block preview', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await pathAdd('deno', { dryRun: true }, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => 'secret profile text\n',
    });
    const text = Cli.stripAnsi(formatPathAdd(report));

    expect(report.profile?.path).to.eql(zshrc);
    expect(report.plan?.kind).to.eql('add');
    expect(text).to.contain('system/shell:tools path add deno');
    expect(text).to.contain('export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"');
    expect(text).to.contain('Edit with: sys shell ...\n\n# @sys.shell path deno');
    expect(text).not.to.contain('secret profile text');
  });
});
