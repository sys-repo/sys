import { describe, expect, it } from '../../../-test.ts';
import { Fs, Process, type t } from '../common.ts';
import { Raw } from '../../m.cli.raw/mod.ts';
import { GitInitMenu } from '../u.menu.git.init.ts';

describe(`@sys/driver-pi/cli/raw/m.main`, () => {
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

        const res = await Raw.main({ argv: [arg] });
        expect(res.kind).to.eql('help');
        if (res.kind !== 'help') throw new Error('Expected help result.');
        expect(res.text).to.contain('deno run -A jsr:@sys/driver-pi/cli/raw');
        expect(res.text).to.contain('only the @sys launch sandbox');
        expect(res.text).to.contain('-h, --help');
        expect(res.text).to.contain('-A, --allow-all');
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
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.main.test.' }))
      .absolute as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--model');
        expect(input.args).to.include('gpt-5.4');
        return { code: 0, success: true, signal: null };
      };

      const res = await Raw.main({ cwd, argv: ['--model', 'gpt-5.4'] });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('main → passes -A through to Pi when separated by --', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.main.test.' }))
      .absolute as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('-A');
        expect(input.args).not.to.include('--allow-all');
        return { code: 0, success: true, signal: null };
      };

      const res = await Raw.main({ cwd, argv: ['--', '-A'] });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('main → passes --help through to Pi when separated by --', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.main.test.' }))
      .absolute as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--help');
        return { code: 0, success: true, signal: null };
      };

      const res = await Raw.main({ cwd, argv: ['--', '--help'] });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('main → grants full Deno permissions when requested before --', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.main.test.' }))
      .absolute as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--allow-all');
        expect(input.args).not.to.include('-A');
        return { code: 0, success: true, signal: null };
      };

      const res = await Raw.main({ cwd, argv: ['-A'] });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('main → passes extra write scope through to Pi launch', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.main.test.' }))
      .absolute as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        const writeArg = findArg(input.args, '--allow-write=');
        expect(writeArg).to.contain(cwd);
        expect(writeArg).to.contain('/tmp/pi-main-extra-write');
        return { code: 0, success: true, signal: null };
      };

      const res = await Raw.main({
        cwd,
        write: ['/tmp/pi-main-extra-write' as t.StringPath],
      });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('main → supports cwd-only git root resolution for smoke testing', async () => {
    const prev = Process.inherit;
    const prevPrompt = GitInitMenu.prompt;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.main.test.' }))
      .absolute as t.StringDir;
    const nested = Fs.join(cwd, 'a', 'b') as t.StringDir;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);

      Process.inherit = async () => {
        throw new Error(
          'Process.inherit should not run when cwd-only resolution declines startup.',
        );
      };
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });

      const res = await Raw.main({ cwd: nested, argv: ['--git-root', 'cwd'] });
      expect(res.kind).to.eql('exit');
    } finally {
      Process.inherit = prev;
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });

  it('main → exits cleanly when git init recovery is declined', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.main.test.' }))
      .absolute as t.StringDir;
    const prevPrompt = GitInitMenu.prompt;
    try {
      Object.defineProperty(GitInitMenu, 'prompt', { value: async () => 'exit' });
      const res = await Raw.main({ cwd, argv: ['--model', 'gpt-5.4'] });
      expect(res.kind).to.eql('exit');
    } finally {
      Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
      await Fs.remove(cwd);
    }
  });
});

function findArg(args: readonly string[], prefix: string) {
  const value = args.find((arg) => arg.startsWith(prefix));
  expect(value).to.be.a('string');
  return value as string;
}
