import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { cli } from '../m.cli.ts';
import { Alias } from '../u.alias.ts';
import { doctor } from '../u.doctor.ts';
import type { shellMenu } from '../u.menu.ts';
import { Path } from '../u.path.ts';

type ShellMenuPick = Awaited<ReturnType<typeof shellMenu>>;

const owner = { id: '@sys.shell', label: '@sys/tools shell', commandHint: 'sys shell' } as const;
const markerStart = `# ━━━ BEGIN: @sys/tools:shell ${'━'.repeat(54)}`;
const markerEnd = `# ━━━ END: @sys/tools:shell ${'━'.repeat(56)}`;

describe('cli.shell CLI', () => {
  describe('routes', () => {
    it('routes `alias list` through the CLI', async () => {
      const output: string[] = [];
      const run = cli as unknown as (
        cwd: t.StringDir,
        argv: string[],
        context: t.ShellTool.CliContext | undefined,
        deps: {
          readonly Alias: Pick<typeof Alias, 'list'>;
          readonly info: (...data: unknown[]) => void;
        },
      ) => Promise<t.ShellTool.CliResult>;

      await run('/tmp' as t.StringDir, ['alias', 'list'], undefined, {
        Alias: {
          list: async () => ({
            owner,
            shell: { path: '/bin/zsh', dialect: 'zsh', support: 'write' },
            profiles: [{
              path: '/home/me/.zshrc' as t.StringPath,
              role: 'interactive',
              exists: true,
              block: { kind: 'missing' },
            }],
            items: [{
              entry: {
                id: 'sys',
                name: 'sys',
                command: 'deno run -A jsr:@sys/tools',
                risk: 'safe',
              },
              state: 'conflict',
              profiles: [],
              conflictProfiles: ['/home/me/.zprofile' as t.StringPath],
              stale: false,
            }],
            warnings: [],
          }),
        },
        info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
      });

      const text = Cli.stripAnsi(output.join('\n'));
      expect(text).to.contain('system:shell alias list');
      expect(text).to.contain('  aliases   sys conflict');
      expect(text).to.contain('            - command:   deno run -A jsr:@sys/tools');
      expect(text).to.contain('            - conflicts: /home/me/.zprofile');
      expect(text).to.contain(
        '  profiles  /home/me/.zshrc (interactive) exists; managed block: absent',
      );
    });

    it('routes `alias enable` through the CLI', async () => {
      const output: string[] = [];
      const run = cli as unknown as (
        cwd: t.StringDir,
        argv: string[],
        context: t.ShellTool.CliContext | undefined,
        deps: {
          readonly Alias: Pick<typeof Alias, 'enable'>;
          readonly info: (...data: unknown[]) => void;
        },
      ) => Promise<t.ShellTool.CliResult>;

      await run('/tmp' as t.StringDir, ['alias', 'enable', 'common', '--dry-run'], undefined, {
        Alias: {
          enable: async (target) => ({
            owner,
            status: 'planned',
            dryRun: true,
            target,
            entries: [{
              id: 'sys',
              name: 'sys',
              command: 'deno run -A jsr:@sys/tools',
              risk: 'safe',
            }],
            profile: {
              path: '/home/me/.zshrc' as t.StringPath,
              role: 'interactive',
              exists: true,
              block: { kind: 'missing' },
            },
            plan: {
              kind: 'add',
              changed: true,
              block: { kind: 'missing' },
              preview:
                `${markerStart}\n# alias: sys\nalias sys="deno run -A jsr:@sys/tools"\n${markerEnd}\n`,
            },
            warnings: ['Dry-run preview only; no changes written'],
          }),
        },
        info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
      });

      expect(Cli.stripAnsi(output.join('\n'))).to.contain('system:shell alias enable common');
    });

    it('routes `path list` through the CLI', async () => {
      const output: string[] = [];
      const run = cli as unknown as (
        cwd: t.StringDir,
        argv: string[],
        context: t.ShellTool.CliContext | undefined,
        deps: {
          readonly Path: Pick<typeof Path, 'list'>;
          readonly info: (...data: unknown[]) => void;
        },
      ) => Promise<t.ShellTool.CliResult>;

      await run('/tmp' as t.StringDir, ['path', 'list'], undefined, {
        Path: {
          list: async () => ({
            owner,
            shell: { path: '/bin/zsh', dialect: 'zsh', support: 'write' },
            env: {
              home: '/home/me' as t.StringDir,
              denoInstall: '/home/me/.deno' as t.StringDir,
              denoBin: '/home/me/.deno/bin' as t.StringDir,
              pathContainsDenoBin: false,
            },
            profiles: [],
            items: [{
              entry: { id: 'deno', label: 'Deno bin', expression: 'export PATH="$PATH"' },
              state: 'missing',
              profiles: [],
              unmanagedProfiles: [],
              stale: false,
            }],
            warnings: [],
          }),
        },
        info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
      });

      const text = Cli.stripAnsi(output.join('\n'));
      expect(text).to.contain('system:shell path list');
      expect(text).to.contain('  profiles     ! no profile candidates');
    });

    it('routes `path add` through the CLI', async () => {
      const output: string[] = [];
      const run = cli as unknown as (
        cwd: t.StringDir,
        argv: string[],
        context: t.ShellTool.CliContext | undefined,
        deps: {
          readonly Path: Pick<typeof Path, 'add'>;
          readonly info: (...data: unknown[]) => void;
        },
      ) => Promise<t.ShellTool.CliResult>;

      await run('/tmp' as t.StringDir, ['path', 'add', 'deno', '--dry-run'], undefined, {
        Path: {
          add: async (target) => ({
            owner,
            status: 'planned',
            dryRun: true,
            target,
            entries: [{ id: 'deno', label: 'Deno bin', expression: 'export PATH="$PATH"' }],
            env: {
              home: '/home/me' as t.StringDir,
              denoInstall: '/home/me/.deno' as t.StringDir,
              denoBin: '/home/me/.deno/bin' as t.StringDir,
              pathContainsDenoBin: false,
            },
            profile: {
              path: '/home/me/.zshrc' as t.StringPath,
              role: 'interactive',
              exists: true,
              block: { kind: 'missing' },
            },
            plan: {
              kind: 'add',
              changed: true,
              block: { kind: 'missing' },
              preview: `${markerStart}\n# path: deno\nexport PATH="$PATH"\n${markerEnd}\n`,
            },
            warnings: ['Dry-run preview only; no changes written'],
          }),
        },
        info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
      });

      expect(Cli.stripAnsi(output.join('\n'))).to.contain('system:shell path add deno');
    });

    it('routes `init` through the CLI', async () => {
      const output: string[] = [];
      let received: t.ShellTool.Apply.Options | undefined;
      const run = cli as unknown as (
        cwd: t.StringDir,
        argv: string[],
        context: t.ShellTool.CliContext | undefined,
        deps: {
          readonly init: (options?: t.ShellTool.Apply.Options) => Promise<t.ShellTool.Apply.Report>;
          readonly info: (...data: unknown[]) => void;
        },
      ) => Promise<t.ShellTool.CliResult>;

      await run(
        '/tmp' as t.StringDir,
        [
          'init',
          '--profile',
          '/tmp/profile',
          '--shell',
          'zsh',
        ],
        undefined,
        {
          init: async (options) => {
            received = options;
            return {
              owner,
              status: 'blocked',
              dryRun: true,
              shell: { path: '/bin/zsh', dialect: 'zsh', support: 'write' },
              env: { pathContainsDenoBin: false },
              aliases: [],
              paths: [],
              warnings: ['No files written'],
            };
          },
          info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
        },
      );

      expect(received).to.eql({
        dryRun: false,
        profile: '/tmp/profile',
        shell: 'zsh',
      });
      expect(Cli.stripAnsi(output.join('\n'))).to.contain('system:shell init');
    });

    it('routes hidden `apply` compatibility alias as init', async () => {
      const output: string[] = [];
      const run = cli as unknown as (
        cwd: t.StringDir,
        argv: string[],
        context: t.ShellTool.CliContext | undefined,
        deps: {
          readonly init: (options?: t.ShellTool.Apply.Options) => Promise<t.ShellTool.Apply.Report>;
          readonly info: (...data: unknown[]) => void;
        },
      ) => Promise<t.ShellTool.CliResult>;

      await run('/tmp' as t.StringDir, ['apply', '--dry-run'], undefined, {
        init: async () => ({
          owner,
          status: 'planned',
          dryRun: true,
          shell: { path: '/bin/zsh', dialect: 'zsh', support: 'write' },
          env: { pathContainsDenoBin: false },
          aliases: [],
          paths: [],
          warnings: ['No files written'],
        }),
        info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
      });

      expect(Cli.stripAnsi(output.join('\n'))).to.contain('system:shell init');
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
        doctor: async () => doctorReport(),
        info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
      });

      expect(Cli.stripAnsi(output.join('\n'))).to.contain('system:shell doctor');
    });
  });

  it('runs `doctor` by default for direct no-command invocation', async () => {
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

    await run('/tmp' as t.StringDir, [], { origin: 'argv' }, {
      doctor: async () => doctorReport(),
      info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
    });

    const text = Cli.stripAnsi(output.join('\n'));
    expect(text).to.contain('system:shell doctor');
    expect(text).to.contain('✓ no issues detected');
    expect(text).to.not.contain('Usage');
  });

  it('shows help instead of running doctor for unknown direct positional input', async () => {
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

    await run('/tmp' as t.StringDir, ['wat'], { origin: 'argv' }, {
      doctor: async () => {
        throw new Error('doctor should not run for unknown positional input');
      },
      info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
    });

    const text = Cli.stripAnsi(output.join('\n'));
    expect(text).to.contain('Usage');
    expect(text).to.contain('shell <command> [options]');
  });

  it('returns back from the shell menu when launched by the root menu', async () => {
    const run = cli as unknown as (
      cwd: t.StringDir,
      argv: string[],
      context: t.ShellTool.CliContext | undefined,
      deps: {
        readonly shellMenu: () => Promise<ShellMenuPick>;
      },
    ) => Promise<t.ShellTool.CliResult>;

    const result = await run('/tmp' as t.StringDir, [], { origin: 'root-menu' }, {
      shellMenu: async () => ({ kind: 'back' }),
    });

    expect(result).to.eql({ kind: 'back' });
  });

  it('runs shell-menu commands and then returns back', async () => {
    const output: string[] = [];
    const picks: ShellMenuPick[] = [
      { kind: 'command', argv: ['doctor'] },
      { kind: 'back' },
    ];
    const run = cli as unknown as (
      cwd: t.StringDir,
      argv: string[],
      context: t.ShellTool.CliContext | undefined,
      deps: {
        readonly doctor: typeof doctor;
        readonly shellMenu: () => Promise<ShellMenuPick>;
        readonly info: (...data: unknown[]) => void;
      },
    ) => Promise<t.ShellTool.CliResult>;

    const result = await run('/tmp' as t.StringDir, [], { origin: 'root-menu' }, {
      doctor: async () => doctorReport(),
      shellMenu: async () => picks.shift() ?? { kind: 'back' },
      info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
    });

    expect(result).to.eql({ kind: 'back' });
    expect(Cli.stripAnsi(output.join('\n'))).to.contain('system:shell doctor');
  });
});

function doctorReport(): t.ShellTool.Doctor.Report {
  return {
    owner,
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
  };
}
