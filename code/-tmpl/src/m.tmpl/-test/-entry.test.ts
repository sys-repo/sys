import { describe, expect, it } from '../../-test.ts';
import { entry } from '../-entry.ts';
import { Prompt } from '../u.prompt.ts';

type PromptMutable = {
  selectTemplate: typeof Prompt.selectTemplate;
  directoryName: typeof Prompt.directoryName;
};

describe('m.tmpl/-entry', () => {
  it('handles -h without prompting', async () => {
    const selectTemplate = Prompt.selectTemplate;
    const directoryName = Prompt.directoryName;
    const prompt = Prompt as unknown as PromptMutable;
    const previousExitCode = Deno.exitCode;

    try {
      prompt.selectTemplate = async () => {
        throw new Error('should not prompt for template when --help is used');
      };
      prompt.directoryName = async () => {
        throw new Error('should not prompt for directory when --help is used');
      };

      Deno.exitCode = 0;
      await entry(['-h']);
      expect(Deno.exitCode).to.eql(0);
    } finally {
      prompt.selectTemplate = selectTemplate;
      prompt.directoryName = directoryName;
      Deno.exitCode = previousExitCode;
    }
  });
});
