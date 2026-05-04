import { describe, expect, it, type t } from '../../../-test.ts';
import { main } from '../mod.ts';

describe(`@sys/driver-pi/cli/main`, () => {
  it('routes default args to the profile-driven launcher', async () => {
    const prevInfo = console.info;
    const prevHelpTool = Deno.env.get('PI_CLI_PROFILES_HELP_TOOL');
    const calls: string[] = [];
    const cwd = '/tmp/driver-pi-main' as t.StringDir;
    try {
      Deno.env.delete('PI_CLI_PROFILES_HELP_TOOL');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      const res = await main({ argv: ['--help'], cwd });
      expect(res.kind).to.eql('help');
      if (res.kind !== 'help') throw new Error('Expected help result.');
      expect(res.input).to.eql({ argv: ['--help'], cwd });
      expect(res.text).to.contain('@sys/driver-pi/cli');
      expect(res.text).to.contain('profile-driven system agent');
      expect(res.text).to.contain('explicit launch sandbox');
      expect(res.text).not.to.contain(' Profiles');
      expect(calls).to.eql([res.text]);
    } finally {
      if (prevHelpTool === undefined) Deno.env.delete('PI_CLI_PROFILES_HELP_TOOL');
      else Deno.env.set('PI_CLI_PROFILES_HELP_TOOL', prevHelpTool);
      console.info = prevInfo;
    }
  });
});
