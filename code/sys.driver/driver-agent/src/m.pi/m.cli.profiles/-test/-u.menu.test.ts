import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { menu } from '../u.menu.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.menu`, () => {
  it('menu → creates default profile config when none exist', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const original = Cli.Input.Select.prompt;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: { message: string }) => {
        expect(input.message).to.eql('Agent:\n');
        return Promise.resolve('exit');
      },
    });

    try {
      const res = await menu({ cwd });
      const path = Fs.join(cwd, '-config/@sys.driver-agent.pi/default.yaml');
      const text = await Deno.readTextFile(path);

      expect(res).to.eql({ kind: 'exit' });
      expect(text).to.contain('# pi profile: default');
      expect(text).to.contain('# Args passed through to Pi.');
      expect(text).to.contain('# Sandbox paths resolve relative to the current working directory.');
      expect(text).to.contain('args: []');
      expect(text).to.contain('sandbox:');
      expect(text).to.contain('read: []');
      expect(text).to.contain('write: []');
      expect(text).to.contain('env: {}');
      expect(text).to.contain('agents: walk-up');
      expect(text).to.contain('include: []');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('menu → uses Agent: for the action prompt', async () => {
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const config = Fs.join(cwd, '-config/@sys.driver-agent.pi/default.yaml');
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
        if (input.message === 'Agent:') {
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });

    try {
      const res = await menu({ cwd });
      expect(res).to.eql({ kind: 'exit' });
      expect(calls).to.eql(['Agent:\n', 'Agent:', 'Agent:\n']);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
