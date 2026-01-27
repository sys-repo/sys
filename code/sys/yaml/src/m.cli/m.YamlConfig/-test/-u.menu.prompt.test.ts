import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../common.ts';
import { promptAction } from '../u.menu.prompt.ts';

describe('YamlConfig.menu.prompt', () => {
  it('renders extra items with a name function', async () => {
    const original = Cli.Input.Select.prompt;
    let seen: { name: string; value: string }[] = [];

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: async (args: { options: { name: string; value: string }[] }) => {
        seen = args.options;
        return args.options[0]?.value ?? 'back';
      },
    });

    try {
      await promptAction({
        name: 'alpha',
        valid: true,
        extra: [{ name: ({ name }) => `run ${name}`, value: 'run' }],
      });

      expect(seen[0]?.name).to.eql('  run alpha');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
    }
  });
});
