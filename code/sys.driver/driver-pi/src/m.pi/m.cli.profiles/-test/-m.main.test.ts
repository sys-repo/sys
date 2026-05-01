import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, Str, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';
import { GitInitMenu } from '../../m.cli/u.menu.git.init.ts';

describe(`@sys/driver-pi/pi/cli/Profiles/m.main`, () => {
  it('help → renders profile help without launching Pi', async () => {
    const check = async (arg: '-h' | '--help') => {
      const prev = Process.inherit;
      const prevHelpTool = Deno.env.get('PI_CLI_PROFILES_HELP_TOOL');
      const prevInfo = console.info;
      const calls: string[] = [];
      try {
        Deno.env.delete('PI_CLI_PROFILES_HELP_TOOL');
        Process.inherit = async () => {
          throw new Error('Process.inherit should not run during help.');
        };
        console.info = (value?: unknown) => calls.push(String(value ?? ''));

        const res = await Profiles.main({ argv: [arg] });
        expect(res.kind).to.eql('help');
        if (res.kind !== 'help') throw new Error('Expected help result.');
        const text = Cli.stripAnsi(res.text);
        expect(text).to.contain('deno run -A jsr:@sys/driver-pi/pi/cli Profiles');
        expect(text).to.contain('-h, --help');
        expect(text).to.contain('-A, --allow-all');
        expect(text).to.contain('--profile <name>');
        expect(text).to.contain('--config <path>');
        expect(text).to.contain('--git-root <walk-up|cwd>');
        expect(text).to.contain('deno run -A jsr:@sys/driver-pi/pi/cli Profiles --git-root cwd');
        expect(text).to.contain('deno run -A jsr:@sys/driver-pi/pi/cli Profiles --allow-all');
        expect(text).to.contain(
          'deno run -A jsr:@sys/driver-pi/pi/cli Profiles -- --model gpt-5.4',
        );
        expect(calls).to.eql([res.text]);
      } finally {
        if (prevHelpTool === undefined) Deno.env.delete('PI_CLI_PROFILES_HELP_TOOL');
        else Deno.env.set('PI_CLI_PROFILES_HELP_TOOL', prevHelpTool);
        Process.inherit = prev;
        console.info = prevInfo;
      }
    };

    await check('-h');
    await check('--help');
  });

  it('help → respects wrapper-provided tool identity override', async () => {
    const prev = Deno.env.get('PI_CLI_PROFILES_HELP_TOOL');
    const prevInfo = console.info;
    const calls: string[] = [];
    try {
      Deno.env.set('PI_CLI_PROFILES_HELP_TOOL', 'deno run -A jsr:@sys/tools pi');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      const res = await Profiles.main({ argv: ['--help'] });
      expect(res.kind).to.eql('help');
      if (res.kind !== 'help') throw new Error('Expected help result.');
      const text = Cli.stripAnsi(res.text);
      expect(text).to.contain('deno run -A jsr:@sys/tools pi');
      expect(text).to.contain('deno run -A jsr:@sys/tools pi --profile my-canon');
      expect(text).to.contain('deno run -A jsr:@sys/tools pi --git-root cwd');
      expect(calls).to.eql([res.text]);
    } finally {
      if (prev === undefined) Deno.env.delete('PI_CLI_PROFILES_HELP_TOOL');
      else Deno.env.set('PI_CLI_PROFILES_HELP_TOOL', prev);
      console.info = prevInfo;
    }
  });

  it('main → runs selected config and passes argv after -- through to Pi', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.write(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              read: [./canon]
              env:
                PI_PROFILE: main
          `,
        ).trimStart(),
      );
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--help']);
        expect(input.args).not.to.include('--model');
        expect(input.env?.PI_PROFILE).to.eql('main');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--config', config, '--', '--help'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('main → routes explicit allow-all through Profiles into the Pi child and sandbox display', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.write(config, 'sandbox: {}\n');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.args).to.include('--allow-all');
        expect(input.args.some((arg) => arg.startsWith('--allow-read='))).to.eql(false);
        expect(input.args.some((arg) => arg.startsWith('--allow-write='))).to.eql(false);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--allow-all', '--config', config] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.match(/permissions\s+allow-all/);
      expect(printed).to.match(/read\s+all/);
      expect(printed).to.match(/write\s+all/);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('main → carries allow-all into the interactive sandbox preview', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi.pi/default.yaml` as t.StringPath;
    const calls: string[] = [];
    let topLevelCount = 0;
    let actionCount = 0;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(config, 'sandbox: {}\n');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));
      Process.inherit = async () => {
        throw new Error('Process.inherit should not run during sandbox preview.');
      };
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: { message: string; options?: { value: string }[] }) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            actionCount += 1;
            if (actionCount === 1) return Promise.resolve('sandbox');
            return Promise.resolve('back');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
      });

      const res = await Profiles.main({ cwd, argv: ['-A'] });
      expect(res.kind).to.eql('exit');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.match(/permissions\s+allow-all/);
      expect(printed).to.match(/read\s+all/);
      expect(printed).to.match(/write\s+all/);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      await Fs.remove(cwd);
    }
  });

  it('main → starts from the profile menu using the already-rendered sandbox preview', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi.pi/canon.yaml` as t.StringPath;
    const calls: string[] = [];
    let topLevelCount = 0;
    let launchCount = 0;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(config, 'sandbox: {}\n');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));
      Process.inherit = async () => {
        launchCount += 1;
        return { code: 0, success: true, signal: null };
      };
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: { message: string; options?: { value: string }[] }) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            return Promise.resolve('run');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
      });

      const res = await Profiles.main({ cwd });
      const reportFiles = (await Fs.ls(Fs.join(cwd, '.log', '@sys.driver-pi.pi') as t.StringDir))
        .filter((path) => path.endsWith('.sandbox.log.md'));
      const printed = Cli.stripAnsi(calls.join('\n'));

      expect(res.kind).to.eql('run');
      expect(launchCount).to.eql(1);
      expect(printed.match(/pi:sandbox/g)?.length).to.eql(1);
      expect(reportFiles.length).to.eql(1);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      await Fs.remove(cwd);
    }
  });

  it('main → resolves --profile via the standard profile file naming convention', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi.pi/canon.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(
        config,
        Str.dedent(`
        sandbox:
          capability:
            env:
              PI_PROFILE: canon
      `).trimStart(),
      );
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--help']);
        expect(input.args).not.to.include('--model');
        expect(input.env?.PI_PROFILE).to.eql('canon');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--profile', 'canon', '--', '--help'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('main → bootstraps the default profile on first direct --profile default run', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--help']);
        const created = `${cwd}/-config/@sys.driver-pi.pi/default.yaml`;
        const read = await Fs.readText(created);
        expect(read.ok).to.eql(true);
        expect(read.data ?? '').to.contain('# pi profile: default');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--profile', 'default', '--', '--help'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
      expect(printed).to.contain('write:cwd');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('main → supports cwd-only git root resolution for smoke testing', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const nested = Fs.join(cwd, 'a', 'b') as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });
      const res = await Profiles.main({ cwd: nested, argv: ['--git-root', 'cwd'] });
      expect(res.kind).to.eql('exit');
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('main → exits cleanly when git init recovery is declined', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });
      const res = await Profiles.main({ cwd, argv: ['--profile', 'canon'] });
      expect(res.kind).to.eql('exit');
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('main → rejects --config and --profile together', async () => {
    let error = '';
    try {
      await Profiles.main({ argv: ['--config', './a.yaml', '--profile', 'canon'] });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    expect(error).to.eql('--config and --profile are mutually exclusive; pass exactly one.');
  });
});
