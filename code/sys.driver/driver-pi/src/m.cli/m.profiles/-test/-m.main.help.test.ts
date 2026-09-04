import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../common.ts';
import { Process as ProcessOwner } from '../../common.ts';
import { Profiles as ProfilesOwner } from '../mod.ts';
import { withInherit } from '../../u/u.inherit.ts';

const Process = { ...ProcessOwner };
const Profiles = {
  ...ProfilesOwner,
  main: (input: Parameters<typeof ProfilesOwner.main>[0]) =>
    withInherit(Process.inherit, () => ProfilesOwner.main(input)),
};

describe(`@sys/driver-pi/cli/Profiles/m.main/help`, () => {
  it('renders profile help without launching Pi', async () => {
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
        expect(text).to.contain('deno run -A jsr:@sys/driver-pi');
        expect(text).to.contain('deno run -A jsr:@sys/driver-pi/cli');
        expect(text).to.contain('deno run -ER jsr:@sys/driver-pi dsl [chapter...]');
        expect(text).to.contain('deno run -ER jsr:@sys/driver-pi dsl profile --format skill');
        expect(text).to.contain(
          'deno run -A jsr:@sys/driver-pi/cli --profile default -- --model gpt-5.4',
        );
        expect(text).to.contain('alias of /cli');
        expect(text).not.to.contain(' Profiles');
        expect(text).to.contain('-h, --help');
        expect(text).to.contain('-A, --allow-all');
        expect(text).to.contain('--non-interactive');
        expect(text).to.contain('--install-ocr-deps');
        expect(text).to.contain('--profile <name|path>');
        expect(text).not.to.contain('--config');
        expect(text).to.contain('--git-root <walk-up|cwd|none>');
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

  it('respects wrapper-provided tool identity override', async () => {
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
      expect(text).not.to.contain('alias of /cli');
      expect(text).not.to.contain('jsr:@sys/driver-pi');
      expect(text).to.contain('deno run -A jsr:@sys/tools pi dsl [chapter...]');
      expect(text).to.contain('deno run -A jsr:@sys/tools pi dsl profile --format skill');
      expect(text).to.contain(
        'deno run -A jsr:@sys/tools pi --profile default -- --model gpt-5.4',
      );
      expect(text).to.contain('--profile <name|path>');
      expect(text).to.contain('--install-ocr-deps');
      expect(text).not.to.contain('--config');
      expect(text).to.contain('--git-root <walk-up|cwd|none>');
      expect(calls).to.eql([res.text]);
    } finally {
      if (prev === undefined) Deno.env.delete('PI_CLI_PROFILES_HELP_TOOL');
      else Deno.env.set('PI_CLI_PROFILES_HELP_TOOL', prev);
      console.info = prevInfo;
    }
  });
});
