import { describe, expect, it } from '../../../-test.ts';
import { Str, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/m.main`, () => {
  it('help → renders profile help without launching Pi', async () => {
    const check = async (arg: '-h' | '--help') => {
      const prev = Process.inherit;
      const prevInfo = console.info;
      const calls: string[] = [];
      try {
        Process.inherit = async () => {
          throw new Error('Process.inherit should not run during help.');
        };
        console.info = (value?: unknown) => calls.push(String(value ?? ''));

        const res = await Profiles.main({ argv: [arg] });
        expect(res.kind).to.eql('help');
        if (res.kind !== 'help') throw new Error('Expected help result.');
        expect(res.text).to.contain('deno run -A jsr:@sys/driver-agent/pi/cli Profiles');
        expect(res.text).to.contain('-h, --help');
        expect(res.text).to.contain('--config <path>');
        expect(res.text).to.contain('deno run -A jsr:@sys/driver-agent/pi/cli Profiles -- --model gpt-5.4');
        expect(calls).to.eql([res.text]);
      } finally {
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
      Deno.env.set('PI_CLI_PROFILES_HELP_TOOL', 'deno run -A jsr:@sys/tools fn');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      const res = await Profiles.main({ argv: ['--help'] });
      expect(res.kind).to.eql('help');
      if (res.kind !== 'help') throw new Error('Expected help result.');
      expect(res.text).to.contain('deno run -A jsr:@sys/tools fn');
      expect(res.text).to.contain('deno run -A jsr:@sys/tools fn --config ./my-config.yaml');
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
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Deno.writeTextFile(
        config,
        Str.dedent(
          `
          args: [--model, gpt-5.4]
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
        expect(input.args).to.include.members(['--model', 'gpt-5.4', '--help']);
        expect(input.env?.PI_PROFILE).to.eql('main');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--config', config, '--', '--help'] });
      expect(res.kind).to.eql('run');
      expect(calls).to.eql([]);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
