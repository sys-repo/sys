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

  it('prints repo-focused help for first-contact usage', async () => {
    const lines: string[] = [];
    const info = console.info;
    const warn = console.warn;
    const previousExitCode = Deno.exitCode;

    try {
      console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
      console.warn = (...args: unknown[]) => lines.push(args.map(String).join(' '));
      Deno.exitCode = 0;

      await entry(['--help']);

      const text = lines.join('\n');
      expect(text.includes('Templates are selected by positional argument, not by JSR subpath.')).to.eql(true);
      expect(text.includes('Use: deno run -A jsr:@sys/tmpl repo')).to.eql(true);
      expect(text.includes('Not: deno run -A jsr:@sys/tmpl/repo')).to.eql(true);
      expect(text.includes('deno run -A jsr:@sys/tmpl --non-interactive --dir my-repo repo')).to.eql(true);
      expect(text.includes('repo      → no extra template flags; identity inferred from --dir')).to.eql(true);
      expect(text.includes('--dir <path>          target directory to create/update')).to.eql(true);
    } finally {
      console.info = info;
      console.warn = warn;
      Deno.exitCode = previousExitCode;
    }
  });
});
