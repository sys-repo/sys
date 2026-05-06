import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { cli } from '../m.cli.ts';
import { Alias } from '../u.alias.ts';
import { doctor } from '../u.doctor.ts';
import { Path } from '../u.path.ts';

describe('cli.shell CLI', () => {
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
          owner: { id: '@sys.shell', label: '@sys/tools shell', commandHint: 'sys shell ...' },
          shell: { path: '/bin/zsh', dialect: 'zsh', support: 'write' },
          profiles: [],
          items: [{
            entry: { id: 'sys', name: 'sys', command: 'deno run -A jsr:@sys/tools', risk: 'safe' },
            state: 'missing',
            profiles: [],
            conflictProfiles: [],
            stale: false,
          }],
          warnings: [],
        }),
      },
      info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
    });

    expect(Cli.stripAnsi(output.join('\n'))).to.contain('system/shell:tools alias list');
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
          owner: { id: '@sys.shell', label: '@sys/tools shell', commandHint: 'sys shell ...' },
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
              '# >>> @sys/tools shell\n# @sys.shell alias sys\nalias sys="deno run -A jsr:@sys/tools"\n# <<< @sys/tools shell\n',
          },
          warnings: ['Dry-run preview only; no changes written'],
        }),
      },
      info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
    });

    expect(Cli.stripAnsi(output.join('\n'))).to.contain('system/shell:tools alias enable common');
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
          owner: { id: '@sys.shell', label: '@sys/tools shell', commandHint: 'sys shell ...' },
          shell: { path: '/bin/zsh', dialect: 'zsh', support: 'write' },
          env: {
            home: '/home/me' as t.StringDir,
            denoInstall: '/home/me/.deno' as t.StringDir,
            denoBin: '/home/me/.deno/bin' as t.StringDir,
            pathContainsDenoBin: false,
          },
          profiles: [],
          items: [{
            entry: { id: 'deno', label: 'deno', expression: 'export PATH="$PATH"' },
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

    expect(Cli.stripAnsi(output.join('\n'))).to.contain('system/shell:tools path list');
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
          owner: { id: '@sys.shell', label: '@sys/tools shell', commandHint: 'sys shell ...' },
          target,
          entries: [{ id: 'deno', label: 'deno', expression: 'export PATH="$PATH"' }],
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
            preview:
              '# >>> @sys/tools shell\n# @sys.shell path deno\nexport PATH="$PATH"\n# <<< @sys/tools shell\n',
          },
          warnings: ['Dry-run preview only; no changes written'],
        }),
      },
      info: (...data: unknown[]) => output.push(data.map(String).join(' ')),
    });

    expect(Cli.stripAnsi(output.join('\n'))).to.contain('system/shell:tools path add deno');
  });

  it('routes `apply` through the CLI', async () => {
    const output: string[] = [];
    let received: t.ShellTool.Apply.Options | undefined;
    const run = cli as unknown as (
      cwd: t.StringDir,
      argv: string[],
      context: t.ShellTool.CliContext | undefined,
      deps: {
        readonly apply: (options?: t.ShellTool.Apply.Options) => Promise<t.ShellTool.Apply.Report>;
        readonly info: (...data: unknown[]) => void;
      },
    ) => Promise<t.ShellTool.CliResult>;

    await run('/tmp' as t.StringDir, [
      'apply',
      '--profile',
      '/tmp/profile',
      '--shell',
      'zsh',
    ], undefined, {
      apply: async (options) => {
        received = options;
        return {
          owner: { id: '@sys.shell', label: '@sys/tools shell', commandHint: 'sys shell ...' },
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
    });

    expect(received).to.eql({
      dryRun: false,
      profile: '/tmp/profile',
      shell: 'zsh',
    });
    expect(Cli.stripAnsi(output.join('\n'))).to.contain('system/shell:tools apply');
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
