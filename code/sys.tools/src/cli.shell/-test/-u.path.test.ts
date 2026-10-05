import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { formatPathAdd, formatPathList } from '../u.fmt.ts';
import { pathAdd, pathList } from '../u.path.ts';

const NOW = new Date('2026-05-06T14:30:12Z');

describe('cli.shell Path', () => {
  it('lists managed PATH state without profile content leakage', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await pathList({
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: `${home}/.deno/bin:/usr/bin` })[name],
      exists: async (path) => path === zshrc,
      async readText() {
        return `secret before\n# ━━━ BEGIN: @sys/tools:shell ${'━'.repeat(54)}
# Generated settings. Do not manually edit. Update with \`sys shell\`.

# path: deno
export DENO_INSTALL="\${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac

# ━━━ END: @sys/tools:shell ${'━'.repeat(56)}
secret after\n`;
      },
    });
    const text = Cli.stripAnsi(formatPathList(report));

    expect(report.items.map((item) => [item.entry.label, item.state])).to.eql([[
      'Deno bin',
      'enabled',
    ]]);
    expect(text).to.contain('system:shell path list');
    expect(text).to.contain('Deno bin enabled');
    expect(text).not.to.contain('secret before');
    expect(text).not.to.contain('secret after');
  });

  it('detects manual Deno PATH profile entries as present', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await pathList({
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => 'export PATH="$HOME/.deno/bin:$PATH"\n',
    });
    const text = Cli.stripAnsi(formatPathList(report));

    expect(report.items.map((item) => [item.entry.label, item.state, item.unmanagedProfiles])).to
      .eql([['Deno bin', 'present', [zshrc]]]);
    expect(text).to.contain('Deno bin present');
    expect(text).to.contain('- expression: export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"');
    expect(text).to.contain(`- manual PATH: ${zshrc}`);
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

    expect(report.status).to.eql('planned');
    expect(report.dryRun).to.eql(true);
    expect(report.profile?.path).to.eql(zshrc);
    expect(report.plan?.kind).to.eql('add');
    expect(text).to.contain('system:shell path add deno');
    expect(text).to.contain('export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"');
    expect(text).to.contain('Update with `sys shell`.');
    expect(text).to.contain('# path: deno');
    expect(text).to.contain('Dry-run preview only; no changes written');
    expect(text).not.to.contain('secret profile text');
  });

  it('writes a backup before adding PATH without --dry-run', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const original = 'user profile text\n';
    const writes: {
      readonly path: t.StringPath;
      readonly text: string;
      readonly force?: boolean;
    }[] = [];

    const report = await pathAdd('deno', {}, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => original,
      async writeText(path, text, options) {
        void writes.push({ path, text, force: options?.force });
      },
      now: () => NOW,
    });
    const text = Cli.stripAnsi(formatPathAdd(report));

    expect(report.status).to.eql('applied');
    expect(report.dryRun).to.eql(false);
    expect(writes.map((item) => [item.path, item.force])).to.eql([
      [`${zshrc}.sys-tools-shell.20260506-143012.bak`, false],
      [zshrc, true],
    ]);
    expect(writes[0]?.text).to.eql(original);
    expect(writes[1]?.text).to.contain('user profile text\n\n# ━━━ BEGIN: @sys/tools:shell');
    expect(writes[1]?.text).to.contain('export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"');
    expect(text).to.contain('wrote:');
    expect(text).to.contain('backup:');
    expect(text).to.contain(`next:   source '${zshrc}'`);
    expect(text).to.contain('verify: sys --help');
    expect(text).not.to.contain('user profile text');
  });
});
