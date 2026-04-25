import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, Str, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';
import { GitInitMenu } from '../../m.cli/u.menu.git.init.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/m.main`, () => {
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
        expect(text).to.contain('deno run -A jsr:@sys/driver-agent/pi/cli Profiles');
        expect(text).to.contain('-h, --help');
        expect(text).to.contain('--profile <name>');
        expect(text).to.contain('--config <path>');
        expect(text).to.contain('--git-root <walk-up|cwd>');
        expect(text).to.contain('deno run -A jsr:@sys/driver-agent/pi/cli Profiles --git-root cwd');
        expect(text).to.contain(
          'deno run -A jsr:@sys/driver-agent/pi/cli Profiles -- --model gpt-5.4',
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
      Deno.env.set('PI_CLI_PROFILES_HELP_TOOL', 'deno run -A jsr:@sys/tools agent');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      const res = await Profiles.main({ argv: ['--help'] });
      expect(res.kind).to.eql('help');
      if (res.kind !== 'help') throw new Error('Expected help result.');
      const text = Cli.stripAnsi(res.text);
      expect(text).to.contain('deno run -A jsr:@sys/tools agent');
      expect(text).to.contain('deno run -A jsr:@sys/tools agent --profile my-canon');
      expect(text).to.contain('deno run -A jsr:@sys/tools agent --git-root cwd');
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
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.m.main.test.' }))
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
      expect(printed).to.contain('Agent:Sandbox');
      expect(printed).to.contain('.sandbox.log.md');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('main → resolves --profile via the standard profile file naming convention', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-agent.pi/canon.yaml` as t.StringPath;
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
      expect(printed).to.contain('Agent:Sandbox');
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
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--help']);
        const created = `${cwd}/-config/@sys.driver-agent.pi/default.yaml`;
        const read = await Fs.readText(created);
        expect(read.ok).to.eql(true);
        expect(read.data ?? '').to.contain('# pi profile: default');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--profile', 'default', '--', '--help'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('Sandbox');
      expect(printed).to.contain('.sandbox.log.md');
      expect(printed).to.contain('write:cwd');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('main → supports cwd-only git root resolution for smoke testing', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.m.main.test.' }))
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
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.m.main.test.' }))
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
