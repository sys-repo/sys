import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { doctor } from '../u.doctor.ts';
import { formatDoctor } from '../u.fmt.ts';

describe('cli.shell doctor', () => {
  it('runs a read-only doctor over shell env and profile candidates', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await doctor({
      env(name) {
        return {
          HOME: home,
          SHELL: '/bin/zsh',
          DENO_INSTALL: `${home}/deno`,
          PATH: `/usr/bin:${home}/deno/bin`,
        }[name];
      },
      exists: async (path) => path === zshrc,
      async readText() {
        return `# ━━━ BEGIN: @sys/tools:shell ${'━'.repeat(54)}
# Generated settings. Do not manually edit. Update with \`sys shell\`.

# alias: sys
alias sys="deno run -A jsr:@sys/tools"

# ━━━ END: @sys/tools:shell ${'━'.repeat(56)}
`;
      },
    });

    expect(report.shell).to.eql({ path: '/bin/zsh', dialect: 'zsh', support: 'write' });
    expect(report.env.pathContainsDenoBin).to.eql(true);
    expect(report.catalog.aliases.map((entry) => entry.name)).to.eql(['sys']);
    expect(report.catalog.paths.map((entry) => [entry.id, entry.label])).to.eql([[
      'deno',
      'Deno bin',
    ]]);
    expect(report.profiles.map((profile) => [profile.path, profile.exists, profile.block.kind])).to
      .eql([
        [zshrc, true, 'present'],
        [`${home}/.zprofile`, false, 'missing'],
      ]);
    expect(report.warnings).to.eql([]);

    const text = Cli.stripAnsi(formatDoctor(report));
    expect(text).to.contain('profile edits: supported');
    expect(text).to.contain('baseline');
    expect(text).to.contain('aliases:      sys');
    expect(text).to.contain('PATH entries: Deno bin');
    expect(text).to.contain(`${zshrc} (interactive) exists; managed block: current`);
    expect(text).to.contain(`${home}/.zprofile (login) missing; managed block: absent`);
    expect(text).to.contain('✓ no issues detected');
  });

  it('formats doctor output without profile content leakage', async () => {
    const report = await doctor({
      env: (name) => ({ HOME: '/home/me', SHELL: '/bin/fish', PATH: '/usr/bin' })[name],
      exists: async () => false,
      readText: async () => 'secret profile text',
    });
    const text = Cli.stripAnsi(formatDoctor(report));

    expect(text).to.contain('system:shell doctor');
    expect(text).to.contain('profile edits: doctor only');
    expect(text).to.contain('Deno bin is not currently on PATH');
    expect(text).not.to.contain('secret profile text');
  });
});
