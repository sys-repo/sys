import { describe, expect, it } from '../../../-test.ts';
import {
  assertNoPromptSurfacePassthrough,
  DEFAULT_SYSTEM_PROMPT,
  PROVENANCE_SAFETY_PROMPT,
  toFinalProvenanceSafetyArgs,
  toPromptArgs,
} from '../u/u.prompt.ts';

describe(`@sys/driver-pi/cli/Profiles/u.prompt`, () => {
  it('DEFAULT_SYSTEM_PROMPT → is the known short Pi-style baseline', () => {
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('You are an expert coding assistant.');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('- read: Read file contents');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain(
      'path-only workspace discovery such as ls, find, and rg --files',
    );
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('File-content authority is only read/edit/write');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('content search is allowed only to locate candidate');
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
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('deno run -ER jsr:@sys/driver-pi dsl');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('For Pi-Driver profile');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('smallest matching chapter');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('requested Pi-Driver/wrapper-owned tool');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('briefly offer to consult Pi-Driver DSL');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('tool is unavailable');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('answer live callability first');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('enablement YAML or setup steps');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('DSL guidance does not prove a tool is callable');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('registered in this live session');
    expect(DEFAULT_SYSTEM_PROMPT).not.to.contain('ocr_pdf');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain('- Be concise in your responses');
    expect(DEFAULT_SYSTEM_PROMPT).to.contain(PROVENANCE_SAFETY_PROMPT);
    expect(DEFAULT_SYSTEM_PROMPT.endsWith(PROVENANCE_SAFETY_PROMPT)).to.eql(true);
  });

  it('toPromptArgs → maps omitted and null prompts to DEFAULT_SYSTEM_PROMPT', () => {
    expect(toPromptArgs()).to.eql(['--system-prompt', DEFAULT_SYSTEM_PROMPT]);
    expect(toPromptArgs({})).to.eql(['--system-prompt', DEFAULT_SYSTEM_PROMPT]);
    expect(toPromptArgs({ system: null })).to.eql(['--system-prompt', DEFAULT_SYSTEM_PROMPT]);
    expect(toPromptArgs({ system: 'Custom prompt.' })).to.eql([
      '--system-prompt',
      `Custom prompt.\n\n${PROVENANCE_SAFETY_PROMPT}`,
    ]);
  });

  it('toPromptArgs → appends local system text only to the default prompt', () => {
    expect(toPromptArgs(undefined, { append: 'Local system.' })).to.eql([
      '--system-prompt',
      `${
        DEFAULT_SYSTEM_PROMPT.replace(`\n\n${PROVENANCE_SAFETY_PROMPT}`, '')
      }\n\nLocal system.\n\n${PROVENANCE_SAFETY_PROMPT}`,
    ]);
    expect(toPromptArgs({ system: 'Custom prompt.' }, { append: 'Local system.' })).to.eql([
      '--system-prompt',
      `Custom prompt.\n\n${PROVENANCE_SAFETY_PROMPT}`,
    ]);
  });

  it('toPromptArgs → can defer provenance safety to a final append fragment', () => {
    const defaultBody = DEFAULT_SYSTEM_PROMPT.replace(
      `\n\n${PROVENANCE_SAFETY_PROMPT}`,
      '',
    );

    expect(toPromptArgs(undefined, { append: 'Local system.', finalSafety: false })).to.eql([
      '--system-prompt',
      `${defaultBody}\n\nLocal system.`,
    ]);
    expect(
      toPromptArgs({ system: `Custom prompt.\n\n${PROVENANCE_SAFETY_PROMPT}` }, {
        finalSafety: false,
      }),
    ).to.eql(['--system-prompt', 'Custom prompt.']);
    expect(toFinalProvenanceSafetyArgs()).to.eql([
      '--append-system-prompt',
      PROVENANCE_SAFETY_PROMPT,
    ]);
  });

  it('toPromptArgs → does not duplicate provenance safety', () => {
    const prompt = `Custom prompt.\n\n${PROVENANCE_SAFETY_PROMPT}`;
    const [, value] = toPromptArgs({ system: prompt });

    expect(countOccurrences(value, PROVENANCE_SAFETY_PROMPT)).to.eql(1);
    expect(value.endsWith(PROVENANCE_SAFETY_PROMPT)).to.eql(true);
  });

  it('assertNoPromptSurfacePassthrough → rejects prompt and instruction-surface args', () => {
    const cases = [
      '--system-prompt',
      '--system-prompt=custom',
      '--system-prompt-file=prompt.md',
      '--append-system-prompt',
      '--append-system-prompt=custom',
      '--prompt-template=custom',
      '--context-files',
      '--skill=custom',
      '--extension=custom.ts',
    ];

    for (const arg of cases) {
      expect(() => assertNoPromptSurfacePassthrough([arg])).to.throw(
        `startup surfaces; passthrough is not allowed: ${arg}`,
      );
    }
  });

  it('assertNoPromptSurfacePassthrough → allows ordinary passthrough args', () => {
    expect(assertNoPromptSurfacePassthrough(['--model', 'gpt-5.4', '--help'])).to.eql(
      undefined,
    );
  });
});

function countOccurrences(text: string, value: string) {
  if (!value) return 0;
  return text.split(value).length - 1;
}
