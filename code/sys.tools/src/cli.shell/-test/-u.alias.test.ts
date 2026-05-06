import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { aliasEnable, aliasList } from '../u.alias.ts';
import { formatAliasEnable, formatAliasList } from '../u.fmt.ts';

describe('cli.shell Alias', () => {
  it('lists managed alias state without profile content leakage', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await aliasList({
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh' })[name],
      exists: async (path) => path === zshrc,
      readText: async () =>
        `secret before\n# >>> @sys/tools shell
# Managed by @sys/tools shell. Edit with: sys shell ...

# @sys.shell alias sys
alias sys="deno run -A jsr:@sys/tools"

# <<< @sys/tools shell
secret after\n`,
    });
    const text = Cli.stripAnsi(formatAliasList(report));

    expect(report.items.map((item) => [item.entry.name, item.state])).to.eql([['sys', 'enabled']]);
    expect(text).to.contain('system:shell alias list');
    expect(text).to.contain('sys enabled');
    expect(text).not.to.contain('secret before');
    expect(text).not.to.contain('secret after');
  });

  it('detects unmanaged shell function alias conflicts', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await aliasList({
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => 'sys() { deno run -A jsr:@sys/tools "$@"; }\n',
    });

    expect(report.items.map((item) => [item.entry.name, item.state, item.conflictProfiles])).to
      .eql([['sys', 'conflict', [zshrc]]]);
  });

  it('plans alias enable as a dry-run managed block preview', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await aliasEnable('sys', { dryRun: true }, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => 'secret profile text\n',
    });
    const text = Cli.stripAnsi(formatAliasEnable(report));

    expect(report.profile?.path).to.eql(zshrc);
    expect(report.plan?.kind).to.eql('add');
    expect(text).to.contain('system:shell alias enable sys');
    expect(text).to.contain('alias sys="deno run -A jsr:@sys/tools"');
    expect(text).to.contain('Edit with: sys shell ...');
    expect(text).to.contain('# @sys.shell alias sys');
    expect(text).not.to.contain('secret profile text');
  });
});
