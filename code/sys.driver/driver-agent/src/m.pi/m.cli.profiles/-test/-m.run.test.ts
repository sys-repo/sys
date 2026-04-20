import { describe, expect, it } from '../../../-test.ts';
import { Str, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/m.run`, () => {
  it('run → merges typed profile sandbox policy and invocation args into raw Pi launch', async () => {
    const prev = Process.inherit;
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Deno.writeTextFile(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              read: [./profile-read]
              write: [./profile-write]
              env:
                PI_PROFILE: work
                PI_KEEP: profile
            context:
              include: [./profile-context]
          `,
        ).trimStart(),
      );

      await Deno.mkdir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const read = findArg(input.args, '--allow-read=');
        const write = findArg(input.args, '--allow-write=');
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--no-prompt');
        expect(input.args).to.include.members(['--model', 'gpt-5.4', '--help']);
        expect(read).to.contain('./profile-read');
        expect(read).to.contain('./profile-context');
        expect(read).to.contain('./extra-read');
        expect(write).to.contain('./profile-write');
        expect(write).to.contain('./extra-write');
        expect(input.env?.PI_PROFILE).to.eql('override');
        expect(input.env?.PI_KEEP).to.eql('profile');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({
        cwd: { invoked: cwd, git: cwd },
        config,
        args: ['--model', 'gpt-5.4', '--help'],
        read: ['./extra-read' as t.StringPath],
        write: ['./extra-write' as t.StringPath],
        env: { PI_PROFILE: 'override' },
      });

      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Deno.remove(cwd, { recursive: true });
    }
  });

  it('run → uses the selected profile file', async () => {
    const prev = Process.inherit;
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Deno.writeTextFile(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              env:
                PI_PROFILE: main
          `,
        ).trimStart(),
      );

      await Deno.mkdir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        expect(input.args).to.include('--no-prompt');
        expect(input.args).to.include.members(['--model', 'gpt-5.4']);
        expect(input.env?.PI_PROFILE).to.eql('main');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({
        cwd: { invoked: cwd, git: cwd },
        config,
        args: ['--model', 'gpt-5.4'],
      });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Deno.remove(cwd, { recursive: true });
    }
  });
});

function findArg(args: readonly string[], prefix: string) {
  const value = args.find((arg) => arg.startsWith(prefix));
  expect(value).to.be.a('string');
  return value as string;
}
