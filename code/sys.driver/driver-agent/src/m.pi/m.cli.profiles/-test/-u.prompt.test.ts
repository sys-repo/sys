import { describe, expect, it } from '../../../-test.ts';
import { DEFAULT_SYSTEM_PROMPT, toPromptArgs } from '../u.prompt.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.prompt`, () => {
  it('DEFAULT_SYSTEM_PROMPT → is the known short Pi-style baseline', () => {
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('You are an expert coding assistant.');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('- read: Read file contents');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('“sys” means “system”');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('deno run jsr:@sys/<pkg> --help');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('- Be concise in your responses');
  });

  it('toPromptArgs → maps null to DEFAULT_SYSTEM_PROMPT and preserves other behavior', () => {
    expect(toPromptArgs()).to.eql([]);
    expect(toPromptArgs({})).to.eql([]);
    expect(toPromptArgs({ system: null })).to.eql(['--system-prompt', DEFAULT_SYSTEM_PROMPT]);
    expect(toPromptArgs({ system: 'Custom prompt.' })).to.eql([
      '--system-prompt',
      'Custom prompt.',
    ]);
  });
});
