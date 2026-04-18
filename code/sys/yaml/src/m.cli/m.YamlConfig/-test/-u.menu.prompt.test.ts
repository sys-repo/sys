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
        path: '/tmp/alpha.yaml',
        valid: true,
        extra: [{ name: ({ name }) => `run ${name}`, value: 'run' }],
      });

      expect(seen[0]?.name).to.eql('  run alpha');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
    }
  });

  it('keeps a fixed indent for action namespaces', async () => {
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
        path: '/tmp/alpha.yaml',
        valid: true,
        extra: [{ name: 'profile: run', value: 'run' }],
      });

      expect(seen[0]?.name).to.eql('  profile: run');
      expect(seen[1]?.name).to.eql('  config: edit');
      expect(seen[2]?.name).to.eql('  config: reload');
      expect(seen[3]?.name).to.eql('  config: rename');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
    }
  });

  it('uses a custom base action label', async () => {
    const original = Cli.Input.Select.prompt;
    let seen: { name: string; value: string }[] = [];
    let message = '';

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: async (args: { message: string; options: { name: string; value: string }[] }) => {
        message = args.message;
        seen = args.options;
        return args.options[0]?.value ?? 'back';
      },
    });

    try {
      await promptAction({
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        message: 'Profile:',
        actionLabel: 'profile',
        extra: [{ name: 'open', value: 'run' }],
      });

      expect(message).to.eql('Profile:');
      expect(seen[0]?.name).to.eql('  open');
      expect(seen[1]?.name).to.eql('  profile: edit');
      expect(seen[2]?.name).to.eql('  profile: reload');
      expect(seen[3]?.name).to.eql('  profile: rename');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
    }
  });
});
