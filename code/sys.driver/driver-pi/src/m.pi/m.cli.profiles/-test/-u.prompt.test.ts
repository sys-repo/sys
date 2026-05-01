import { describe, expect, it } from '../../../-test.ts';
import { DEFAULT_SYSTEM_PROMPT, toPromptArgs } from '../u.prompt.ts';

describe(`@sys/driver-pi/pi/cli/Profiles/u.prompt`, () => {
  it('DEFAULT_SYSTEM_PROMPT → is the known short Pi-style baseline', () => {
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('You are an expert coding assistant.');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('- read: Read file contents');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain(
      'path-only workspace discovery such as ls, find, and rg --files',
    );
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('File-content authority is only read/edit/write');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('rg content search');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('If read/edit/write is denied by permissions');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('NO AMBIENT HELPER RUNTIMES');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('python3, pip, node, npm, npx');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('Use TypeScript on Deno for ephemeral computation');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain(
      'declared repo tasks may run their configured toolchains',
    );
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('Deno eval/run is allowed only');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('never use deno eval, deno run, or -A to bypass');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('`@sys` scope (“sys” = “system”)');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('import `@sys/*` libraries');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('deno run jsr:@sys/<pkg> --help');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('- Be concise in your responses');
  });

  it('toPromptArgs → maps omitted and null prompts to DEFAULT_SYSTEM_PROMPT', () => {
    expect(toPromptArgs()).to.eql(['--system-prompt', DEFAULT_SYSTEM_PROMPT]);
    expect(toPromptArgs({})).to.eql(['--system-prompt', DEFAULT_SYSTEM_PROMPT]);
    expect(toPromptArgs({ system: null })).to.eql(['--system-prompt', DEFAULT_SYSTEM_PROMPT]);
    expect(toPromptArgs({ system: 'Custom prompt.' })).to.eql([
      '--system-prompt',
      'Custom prompt.',
    ]);
  });

  it('toPromptArgs → appends local system text only to the default prompt', () => {
    expect(toPromptArgs(undefined, { append: 'Local system.' })).to.eql([
      '--system-prompt',
      `${DEFAULT_SYSTEM_PROMPT}\n\nLocal system.`,
    ]);
    expect(toPromptArgs({ system: 'Custom prompt.' }, { append: 'Local system.' })).to.eql([
      '--system-prompt',
      'Custom prompt.',
    ]);
  });
});
