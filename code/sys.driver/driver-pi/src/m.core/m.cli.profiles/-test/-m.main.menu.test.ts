import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-pi/cli/Profiles/m.main/menu`, () => {
  it('carries allow-all into the interactive sandbox preview', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/default.yaml` as t.StringPath;
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

      const res = await Profiles.main({ cwd, argv: ['-A'], tty: { stdin: true, stdout: true } });
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

  it('starts from the profile menu using the already-rendered sandbox preview', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
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

      const res = await Profiles.main({ cwd, tty: { stdin: true, stdout: true } });
      const reportFiles = (await Fs.ls(
        Fs.join(cwd, '.pi', '@sys', 'log', '@sys.driver-pi') as t.StringDir,
      )).filter((path) => path.endsWith('.sandbox.log.md'));
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
});
