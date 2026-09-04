import { Cli, describe, expect, it } from '../../-test.ts';
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

      const text = normalizeOutput(lines.join('\n'));
      expect(text.includes('deno run -ERW jsr:@sys/tmpl <template> [flags]')).to.eql(true);
      expect(text.includes('deno run -ERW jsr:@sys/tmpl dsl [chapter...]')).to.eql(true);
      expect(text.includes('deno run -ERW jsr:@sys/tmpl --non-interactive --dir my-thing repo')).to
        .eql(true);
      expect(text.includes('--dir my-repo repo')).to.eql(false);
      expect(text.includes('jsr:@sys/tmpl/repo')).to.eql(false);
      expect(
        text.includes(
          'Agents must read `dsl` before applying a template, then read the matching chapter from the DSL chapter index.',
        ),
      ).to.eql(true);
      expect(text.includes('dsl')).to.eql(true);
      expect(
        text.includes(
          'agent must read first — classify target boundary, required slots, command grammar, and chapter index',
        ),
      ).to.eql(true);
      expect(text.includes('<template>')).to.eql(true);
      expect(text.includes('apply one template by name; see Templates below')).to.eql(true);
      expect(text.indexOf('Commands')).to.be.lessThan(text.indexOf('Templates'));
      expect(text.indexOf('Templates')).to.be.lessThan(text.indexOf('Examples'));
      expect(text.indexOf('deno run -ERW jsr:@sys/tmpl dsl')).to.be.lessThan(
        text.indexOf('deno run -ERW jsr:@sys/tmpl repo'),
      );
      expect(text.includes('Prompt mapping')).to.eql(true);
      expect(text.includes('workspace root')).to.eql(true);
      expect(text.includes('package inside workspace')).to.eql(true);
      expect(text.includes('React UI + controller/state')).to.eql(true);
      expect(text.includes('m.mod.ui.controller (--name)')).to.eql(true);
      expect(text.includes('repo')).to.eql(true);
      expect(text.includes('•')).to.eql(true);
      expect(text.includes('- m.mod')).to.eql(false);
      expect(text.includes('no extra flags; identity from --dir')).to.eql(true);
      expect(text.includes('--dir <path>')).to.eql(true);
      expect(text.includes('target directory to create/update')).to.eql(true);
      expect(text.includes('--dry-run')).to.eql(true);
      expect(text.includes('write preview only')).to.eql(true);
      expect(text.includes('--dryRun')).to.eql(false);
    } finally {
      console.info = info;
      console.warn = warn;
      Deno.exitCode = previousExitCode;
    }
  });

  it('prints DSL hint for scaffold argument errors', async () => {
    const lines: string[] = [];
    const info = console.info;
    const warn = console.warn;
    const previousExitCode = Deno.exitCode;

    try {
      console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
      console.warn = (...args: unknown[]) => lines.push(args.map(String).join(' '));
      Deno.exitCode = 0;

      await entry(['pkg', '--dir', 'code/ns/foo', '--non-interactive']);

      const text = lines.join('\n');
      expect(Deno.exitCode).to.eql(1);
      expect(text.includes('Template "pkg" requires --pkgName')).to.eql(true);
      expect(text.includes('hint: deno run -ERW jsr:@sys/tmpl dsl pkg')).to.eql(true);
    } finally {
      console.info = info;
      console.warn = warn;
      Deno.exitCode = previousExitCode;
    }
  });
});

function normalizeOutput(output: string): string {
  return Cli.stripAnsi(output).replace(/\s+/g, ' ').trim();
}
