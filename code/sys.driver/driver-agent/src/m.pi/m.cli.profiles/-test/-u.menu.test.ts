import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { menu } from '../u.menu.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.menu`, () => {
  it('menu → creates default profile config when none exist', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;

    await Fs.ensureDir(Fs.join(cwd, '.git'));

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: { message: string }) => {
        expect(input.message).to.eql('Agent:\n');
        return Promise.resolve('exit');
      },
    });

    try {
      const res = await menu({ cwd });
      const path = Fs.join(cwd, '-config/@sys.driver-agent.pi/default.yaml');
      const read = await Fs.readText(path);
      expect(read.ok).to.eql(true);
      const text = read.data ?? '';

      expect(res).to.eql({ kind: 'exit' });
      expect(text).to.contain('# pi profile: default');
      expect(text).to.contain('# Typed Pi launcher policy.');
      expect(text).to.contain('prompt:');
      expect(text).to.contain('sandbox:');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Fs.remove(cwd);
    }
  });

  it('menu → uses Harness: for the action prompt', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const config = Fs.join(cwd, '-config/@sys.driver-agent.pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    const calls: string[] = [];
    let topLevelCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: { message: string }) => {
        calls.push(input.message);
        if (input.message === 'Agent:\n') {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (input.message === 'Harness:') {
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });

    try {
      const res = await menu({ cwd });
      expect(res).to.eql({ kind: 'exit' });
      expect(calls).to.eql(['Agent:\n', 'Harness:', 'Agent:\n']);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Fs.remove(cwd);
    }
  });

  it('menu → sandbox prints effective scope and returns to the action menu', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-agent.pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-agent.pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    const prompts: string[] = [];
    const prints: string[] = [];
    let topLevelCount = 0;
    let actionCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: { message: string }) => {
        prompts.push(input.message);
        if (input.message === 'Agent:\n') {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (input.message === 'Harness:') {
          actionCount += 1;
          if (actionCount === 1) return Promise.resolve('sandbox');
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    console.info = (value?: unknown) => prints.push(String(value ?? ''));

    try {
      const res = await menu({ cwd });
      const printed = Cli.stripAnsi(prints.join('\n'));
      expect(res).to.eql({ kind: 'exit' });
      expect(printed).to.contain('Agent:Sandbox');
      expect(printed).to.match(/report\s+.*\.sandbox\.log\.md/);
      expect(printed).to.not.contain(`${cwd}/.log`);
      expect(printed).to.contain('.sandbox.log.md');
      expect(prompts).to.eql(['Agent:\n', 'Harness:', 'Harness:', 'Agent:\n']);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });
});
