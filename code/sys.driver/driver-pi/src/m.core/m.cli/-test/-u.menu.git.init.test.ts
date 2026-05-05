import { describe, expect, it } from '../../../-test.ts';
import { c, Cli } from '../common.ts';
import { GitInitMenu } from '../u.menu.git.init.ts';

describe('@sys/driver-pi/cli/u.menu.git.init', () => {
  it('prompt → prints the setup block and asks for a minimal action choice', async () => {
    const prevPrompt = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const prints: string[] = [];

    try {
      console.info = (value?: unknown) => prints.push(String(value ?? ''));
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: {
          message: string;
          options: readonly { name: string; value: string }[];
        }) => {
          expect(input.message).to.eql('Action');
          expect(input.options).to.eql([
            { name: c.cyan('create'), value: 'create' },
            { name: 'exit', value: 'exit' },
          ]);
          return Promise.resolve('create');
        },
      });

      const res = await GitInitMenu.prompt('/Users/phil/Documents/tmp/foo-1' as never);
      const printed = Cli.stripAnsi(prints.join('\n'));
      expect(res).to.eql('create');
      expect(printed).to.contain('Agent:Directory Setup · read, write, edit, bash');
      expect(printed).to.contain('This directory is not inside a git repository.');
      expect(printed).to.contain('Target');
      expect(printed).to.contain('/Users/phil/Documents/tmp/foo-1/.git');
      expect(printed).to.contain('Adds');
      expect(printed).to.contain('.gitattributes (Git LFS)');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: prevPrompt });
      console.info = prevInfo;
    }
  });
});
