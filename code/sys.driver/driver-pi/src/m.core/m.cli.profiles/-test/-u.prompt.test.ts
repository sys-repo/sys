import { describe, expect, it } from '../../../-test.ts';
import {
  assertNoPromptSurfacePassthrough,
  DEFAULT_SYSTEM_PROMPT,
  PROVENANCE_SAFETY_PROMPT,
  toFinalProvenanceSafetyArgs,
  toPromptArgs,
} from '../u/u.prompt.ts';

describe(`@sys/driver-pi/cli/Profiles/u.prompt`, () => {
  it('DEFAULT_SYSTEM_PROMPT → permits Git observation without granting mutation', () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    const policy = {
      allowsHistoricalContent: prompt.includes('git show') &&
        prompt.includes('historical tracked content'),
      reservesMutation: prompt.includes('Read-only Git inspection does not authorize mutation') &&
        prompt.includes('explicit human instruction naming that mutation'),
      omitsLegacyBan: !prompt.includes('File-content authority is only read/edit/write'),
    };

    expect(policy).to.eql({
      allowsHistoricalContent: true,
      reservesMutation: true,
      omitsLegacyBan: true,
    });
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
