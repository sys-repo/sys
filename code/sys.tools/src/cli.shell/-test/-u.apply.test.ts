import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { apply } from '../u.apply.ts';
import { formatApply } from '../u.fmt.ts';

const NOW = new Date('2026-05-06T14:30:12Z');

describe('cli.shell init', () => {
  it('plans the recommended baseline as a dry-run without profile content leakage', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const denoBin = `${home}/.deno/bin` as t.StringPath;
    const writes: t.StringPath[] = [];

    const report = await apply({ dryRun: true }, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc || path === denoBin,
      readText: async () => 'secret profile text\n',
      writeText: async (path) => void writes.push(path),
      now: () => NOW,
    });
    const text = Cli.stripAnsi(formatApply(report));

    expect(report.status).to.eql('planned');
    expect(report.dryRun).to.eql(true);
    expect(report.backup).to.eql(`${zshrc}.sys-tools-shell.20260506-143012.bak`);
    expect(report.plan?.kind).to.eql('add');
    expect(report.paths.map((entry) => entry.id)).to.eql(['deno']);
    expect(report.aliases.map((entry) => entry.name)).to.eql(['sys']);
    expect(writes).to.eql([]);
    expect(text).to.contain('system:shell init');
    expect(text).to.contain('backup:');
    expect(text).to.contain('export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"');
    expect(text).to.contain('alias sys="deno run -A jsr:@sys/tools"');
    expect(text).to.contain('No files written');
    expect(text).to.contain('Initialize with: sys shell init');
    expect(text).not.to.contain('secret profile text');
  });

  it('writes a backup before updating the profile on init', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const denoBin = `${home}/.deno/bin` as t.StringPath;
    const original = 'user profile text\n';
    const writes: {
      readonly path: t.StringPath;
      readonly text: string;
      readonly force?: boolean;
    }[] = [];

    const report = await apply({}, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc || path === denoBin,
      readText: async () => original,
      async writeText(path, text, options) {
        void writes.push({ path, text, force: options?.force });
      },
      now: () => NOW,
    });
    const text = Cli.stripAnsi(formatApply(report));

    expect(report.status).to.eql('applied');
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

  it('prevents the profile write when backup creation fails', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const denoBin = `${home}/.deno/bin` as t.StringPath;
    const writes: t.StringPath[] = [];

    const report = await apply({}, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc || path === denoBin,
      readText: async () => 'profile\n',
      writeText: async (path) => {
        writes.push(path);
        throw new Error('permission denied');
      },
      now: () => NOW,
    });

    expect(report.status).to.eql('blocked');
    expect(writes).to.eql([`${zshrc}.sys-tools-shell.20260506-143012.bak`]);
    expect(report.warnings.join('\n')).to.contain('Failed to write backup');
    expect(report.warnings.join('\n')).to.contain('permission denied');
  });

  it('blocks init when the target profile cannot be read', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const denoBin = `${home}/.deno/bin` as t.StringPath;
    const writes: t.StringPath[] = [];

    const report = await apply({}, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc || path === denoBin,
      readText: async () => {
        throw new Error('permission denied');
      },
      writeText: async (path) => void writes.push(path),
      now: () => NOW,
    });

    expect(report.status).to.eql('blocked');
    expect(writes).to.eql([]);
    expect(report.warnings.join('\n')).to.contain(`Failed to read profile ${zshrc}`);
    expect(report.warnings.join('\n')).to.contain('Cannot update unreadable profile');
    expect(report.warnings.join('\n')).to.contain('permission denied');
  });

  it('blocks init when an unmanaged sys alias already exists', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const denoBin = `${home}/.deno/bin` as t.StringPath;
    const writes: t.StringPath[] = [];

    const report = await apply({}, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc || path === denoBin,
      readText: async () => 'alias sys="custom"\n',
      writeText: async (path) => void writes.push(path),
      now: () => NOW,
    });

    expect(report.status).to.eql('blocked');
    expect(writes).to.eql([]);
    expect(report.warnings.join('\n')).to.contain('unmanaged alias/function: sys');
  });

  it('blocks dry-run init plans that would collide with unmanaged aliases', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const denoBin = `${home}/.deno/bin` as t.StringPath;
    const writes: t.StringPath[] = [];

    const report = await apply({ dryRun: true }, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc || path === denoBin,
      readText: async () => 'alias sys="custom"\n',
      writeText: async (path) => void writes.push(path),
      now: () => NOW,
    });
    const text = Cli.stripAnsi(formatApply(report));

    expect(report.status).to.eql('blocked');
    expect(report.dryRun).to.eql(true);
    expect(writes).to.eql([]);
    expect(report.warnings.join('\n')).to.contain('unmanaged alias/function: sys');
    expect(text).not.to.contain('Initialize with: sys shell init');
  });

  it('blocks ambiguous bash profile selection without an explicit profile', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const bashrc = `${home}/.bashrc` as t.StringPath;
    const bashProfile = `${home}/.bash_profile` as t.StringPath;
    const denoBin = `${home}/.deno/bin` as t.StringPath;
    const writes: t.StringPath[] = [];

    const report = await apply({}, {
      env: (name) => ({ HOME: home, SHELL: '/bin/bash', PATH: '/usr/bin' })[name],
      exists: async (path) => path === bashrc || path === bashProfile || path === denoBin,
      readText: async () => 'profile\n',
      writeText: async (path) => void writes.push(path),
      now: () => NOW,
    });

    expect(report.status).to.eql('blocked');
    expect(report.profile).to.eql(undefined);
    expect(writes).to.eql([]);
    expect(report.warnings.join('\n')).to.contain('Cannot choose a bash profile safely');
  });

  it('does not invent a Deno PATH entry when no trustworthy target is known', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;

    const report = await apply({ dryRun: true }, {
      env: (name) => ({ HOME: home, SHELL: '/bin/zsh', PATH: '/usr/bin' })[name],
      exists: async (path) => path === zshrc,
      readText: async () => 'profile\n',
      now: () => NOW,
    });
    const text = Cli.stripAnsi(formatApply(report));

    expect(report.status).to.eql('planned');
    expect(report.paths).to.eql([]);
    expect(report.aliases.map((entry) => entry.name)).to.eql(['sys']);
    expect(report.plan?.preview).not.to.contain('DENO_INSTALL');
    expect(text).to.contain('path Deno bin skipped');
    expect(text).to.contain('alias sys="deno run -A jsr:@sys/tools"');
    expect(text).to.contain('Skipped Deno PATH entry');
    expect(text).to.contain('Initialize with: sys shell init');
  });
});
