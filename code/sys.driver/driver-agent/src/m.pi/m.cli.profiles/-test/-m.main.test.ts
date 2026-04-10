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
        expect(res.text).to.contain('@sys/driver-agent/pi/cli Profiles');
        expect(res.text).to.contain('-h, --help');
        expect(res.text).to.contain('--config <path>');
        expect(res.text).to.contain('deno task cli:profiles');
        expect(calls).to.eql([res.text]);
      } finally {
        Process.inherit = prev;
        console.info = prevInfo;
      }
    };

    await check('-h');
    await check('--help');
  });

  it('main → runs selected config and passes argv after -- through to Pi', async () => {
    const prev = Process.inherit;
    const cwd = await Deno.makeTempDir() as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Deno.writeTextFile(
        config,
        Str.dedent(
          `
          profiles:
            - name: default
              args: [--model, gpt-5.4]
              read: [./canon]
              env:
                PI_PROFILE: default
          `,
        ).trimStart(),
      );

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--model', 'gpt-5.4', '--help']);
        expect(input.env?.PI_PROFILE).to.eql('default');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--config', config, '--', '--help'] });
      expect(res.kind).to.eql('run');
    } finally {
      Process.inherit = prev;
      await Deno.remove(cwd, { recursive: true });
    }
  });
});
