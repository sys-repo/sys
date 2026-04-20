import { describe, expect, it } from '../../../-test.ts';
import { Fs, Process, type t } from '../common.ts';
import { Cli } from '../mod.ts';
import { GitInitMenu } from '../u.menu.git.init.ts';

describe(`@sys/driver-agent/pi/cli/m.main`, () => {
  it('help → renders wrapper help without launching Pi', async () => {
    const check = async (arg: '-h' | '--help') => {
      const prev = Process.inherit;
      const prevInfo = console.info;
      const calls: string[] = [];
      try {
        Process.inherit = async () => {
          throw new Error('Process.inherit should not run during help.');
        };
        console.info = (value?: unknown) => calls.push(String(value ?? ''));

        const res = await Cli.main({ argv: [arg] });
        expect(res.kind).to.eql('help');
        if (res.kind !== 'help') throw new Error('Expected help result.');
        expect(res.text).to.contain('@sys/driver-agent/pi/cli');
        expect(res.text).to.contain('-h, --help');
        expect(calls).to.eql([res.text]);
      } finally {
        Process.inherit = prev;
        console.info = prevInfo;
      }
    };

    await check('-h');
    await check('--help');
  });

  it('main → passes non-wrapper argv through to Pi launch unchanged', async () => {
    const prev = Process.inherit;
    const cwd = await Deno.makeTempDir() as t.StringDir;
    try {
      await Deno.mkdir(Fs.join(cwd, '.git'));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--model');
        expect(input.args).to.include('gpt-5.4');
        return { code: 0, success: true, signal: null };
      };

      const res = await Cli.main({ cwd, argv: ['--model', 'gpt-5.4'] });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('main → passes --help through to Pi when separated by --', async () => {
    const prev = Process.inherit;
    const cwd = await Deno.makeTempDir() as t.StringDir;
    try {
      await Deno.mkdir(Fs.join(cwd, '.git'));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--help');
        return { code: 0, success: true, signal: null };
      };

      const res = await Cli.main({ cwd, argv: ['--', '--help'] });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('main → exits cleanly when git init recovery is declined', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });
      const res = await Cli.main({ cwd, argv: ['--model', 'gpt-5.4'] });
      expect(res.kind).to.eql('exit');
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
