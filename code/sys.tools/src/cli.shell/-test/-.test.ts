import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { ShellTools } from '../mod.ts';
import { cli } from '../m.cli.ts';
import { doctor } from '../u.doctor.ts';
import { formatDoctor } from '../u.fmt.ts';

describe('cli.shell', () => {
  it('API', async () => {
    const m = await import('@sys/tools/shell');
    expect(m.ShellTools).to.equal(ShellTools);
  });

  it('runs a read-only doctor over shell env and profile candidates', async () => {
    const home = '/tmp/sys-tools-shell-home' as t.StringDir;
    const zshrc = `${home}/.zshrc` as t.StringPath;
    const report = await doctor({
      env: (name) =>
        ({
          HOME: home,
          SHELL: '/bin/zsh',
          DENO_INSTALL: `${home}/deno`,
          PATH: `/usr/bin:${home}/deno/bin`,
        })[name],
      exists: async (path) => path === zshrc,
      readText: async () =>
        `# >>> @sys/tools shell
# Managed by @sys/tools shell. Edit with: sys shell ...

# @sys.shell alias sys
alias sys="deno run -A jsr:@sys/tools"

# <<< @sys/tools shell
`,
    });

    expect(report.shell).to.eql({ path: '/bin/zsh', dialect: 'zsh', support: 'write' });
    expect(report.env.pathContainsDenoBin).to.eql(true);
    expect(report.catalog.aliases.map((entry) => entry.name)).to.eql(['sys']);
    expect(report.catalog.paths.map((entry) => entry.id)).to.eql(['deno']);
    expect(report.profiles.map((profile) => [profile.path, profile.exists, profile.block.kind])).to
      .eql([
        [zshrc, true, 'present'],
        [`${home}/.zprofile`, false, 'missing'],
      ]);
    expect(report.warnings).to.eql([]);
  });

  it('formats doctor output without profile content leakage', async () => {
    const report = await doctor({
      env: (name) => ({ HOME: '/home/me', SHELL: '/bin/fish', PATH: '/usr/bin' })[name],
      exists: async () => false,
      readText: async () => 'secret profile text',
    });
    const text = Cli.stripAnsi(formatDoctor(report));

    expect(text).to.contain('system/shell:tools doctor');
    expect(text).to.contain('support: doctor-only');
    expect(text).to.contain('Deno install bin is not currently on PATH');
    expect(text).not.to.contain('secret profile text');
  });

  it('routes `doctor` through the CLI', async () => {
    const output: string[] = [];
    const run = cli as unknown as (
      cwd: t.StringDir,
      argv: string[],
      context: t.ShellTool.CliContext | undefined,
      deps: {
        readonly doctor: typeof doctor;
        readonly info: (...data: unknown[]) => void;
      },
    ) => Promise<t.ShellTool.CliResult>;

    await run('/tmp' as t.StringDir, ['doctor'], undefined, {
      doctor: async () => ({
        owner: { id: '@sys.shell', label: '@sys/tools shell', commandHint: 'sys shell ...' },
        shell: { path: '/bin/zsh', dialect: 'zsh', support: 'write' },
        env: {
          home: '/home/me' as t.StringDir,
          denoInstall: '/home/me/.deno' as t.StringDir,
          denoBin: '/home/me/.deno/bin' as t.StringDir,
          pathContainsDenoBin: true,
        },
        profiles: [],
        catalog: { aliases: [], paths: [] },
        warnings: [],
      }),
      info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
    });

    expect(Cli.stripAnsi(output.join('\n'))).to.contain('system/shell:tools doctor');
  });
});
