import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { aliasEnable, aliasList } from '../u.alias.ts';
import { formatAliasEnable, formatAliasList } from '../u.fmt.ts';

const NOW = new Date('2026-05-06T14:30:12Z');

describe('cli.shell Alias', () => {
  it('lists managed alias state without profile content leakage', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await aliasList({
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh' })[name],
      exists: async (path) => path === zshrc,
      async readText() {
        return `secret before\n# ━━━ BEGIN: @sys/tools:shell ${'━'.repeat(54)}
# Generated settings. Do not manually edit. Update with \`sys shell\`.

# alias: sys
alias sys="deno run -A jsr:@sys/tools"

# ━━━ END: @sys/tools:shell ${'━'.repeat(56)}
secret after\n`;
      },
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

    expect(report.status).to.eql('planned');
    expect(report.dryRun).to.eql(true);
    expect(report.profile?.path).to.eql(zshrc);
    expect(report.plan?.kind).to.eql('add');
    expect(text).to.contain('system:shell alias enable sys');
    expect(text).to.contain('alias sys="deno run -A jsr:@sys/tools"');
    expect(text).to.contain('Update with `sys shell`.');
    expect(text).to.contain('# alias: sys');
    expect(text).to.contain('Dry-run preview only; no changes written');
    expect(text).not.to.contain('secret profile text');
  });

  it('writes a backup before enabling aliases without --dry-run', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const original = 'user profile text\n';
    const writes: {
      readonly path: t.StringPath;
      readonly text: string;
      readonly force?: boolean;
    }[] = [];

    const report = await aliasEnable('sys', {}, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => original,
      async writeText(path, text, options) {
        void writes.push({ path, text, force: options?.force });
      },
      now: () => NOW,
    });
    const text = Cli.stripAnsi(formatAliasEnable(report));

    expect(report.status).to.eql('applied');
    expect(report.dryRun).to.eql(false);
    expect(writes.map((item) => [item.path, item.force])).to.eql([
      [`${zshrc}.sys-tools-shell.20260506-143012.bak`, false],
      [zshrc, true],
    ]);
    expect(writes[0]?.text).to.eql(original);
    expect(writes[1]?.text).to.contain('user profile text\n\n# ━━━ BEGIN: @sys/tools:shell');
    expect(writes[1]?.text).to.contain('alias sys="deno run -A jsr:@sys/tools"');
    expect(text).to.contain('wrote:');
    expect(text).to.contain('backup:');
    expect(text).to.contain(`next:   source '${zshrc}'`);
    expect(text).to.contain('verify: sys --help');
    expect(text).not.to.contain('user profile text');
  });
});
