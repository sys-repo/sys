import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../common.ts';
import { promptAction } from '../u/u.menu.prompt.ts';

describe('YamlConfig.menu.prompt', () => {
  it('renders extra items with a name function', async () => {
    const original = Cli.Input.Select.prompt;
    let seen: { name: string; value: string }[] = [];

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: { options: { name: string; value: string }[] }) => {
        seen = args.options;
        return Promise.resolve(args.options[0]?.value ?? 'back');
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
      value: (args: { options: { name: string; value: string }[] }) => {
        seen = args.options;
        return Promise.resolve(args.options[0]?.value ?? 'back');
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

  it('places extraAfter items after base actions and before delete/back', async () => {
    const original = Cli.Input.Select.prompt;
    let seen: { name: string; value: string }[] = [];

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: { options: { name: string; value: string }[] }) => {
        seen = args.options;
        return Promise.resolve(args.options[0]?.value ?? 'back');
      },
    });

    try {
      await promptAction({
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        extra: [{ name: 'start', value: 'run' }],
        extraAfter: [{ name: 'reload', value: 'sandbox' }],
      });

      expect(seen.map((item) => Cli.stripAnsi(item.name))).to.eql([
        '  start',
        '  config: edit',
        '  config: reload',
        '  config: rename',
        '  reload',
        ' (delete)',
        '← back',
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
    }
  });

  it('uses a custom base action label', async () => {
    const original = Cli.Input.Select.prompt;
    let seen: { name: string; value: string }[] = [];
    let message = '';

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: { message: string; options: { name: string; value: string }[] }) => {
        message = args.message;
        seen = args.options;
        return Promise.resolve(args.options[0]?.value ?? 'back');
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

  it('submenu label mode → restores a base-action default in the submenu', async () => {
    const original = Cli.Input.Select.prompt;
    let seen: string[] = [];
    let message = '';
    let defaultValue = '';

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: {
        message: string;
        default?: string;
        options: { name: string; value: string }[];
      }) => {
        seen = args.options.map((item) => Cli.stripAnsi(item.name));
        message = Cli.stripAnsi(args.message);
        defaultValue = args.default ?? '';
        return Promise.resolve('rename');
      },
    });

    try {
      const action = await promptAction({
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        labelMode: 'submenu',
        defaultValue: 'reload',
      });

      expect(action).to.eql('rename');
      expect(message).to.eql('config');
      expect(defaultValue).to.eql('reload');
      expect(seen).to.eql(['  edit', '  reload', '  rename', ' (delete)', '← back']);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
    }
  });

  it('submenu label mode → filters invalid-document actions', async () => {
    const original = Cli.Input.Select.prompt;
    const seen: string[][] = [];

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: { options: { name: string; value: unknown }[] }) => {
        const options = args.options;
        seen.push(options.map((item) => Cli.stripAnsi(item.name)));
        if (seen.length === 1) {
          return Promise.resolve(options.find((item) => item.name === '  config')?.value);
        }
        return Promise.resolve('edit');
      },
    });

    try {
      const action = await promptAction({
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: false,
        labelMode: 'submenu',
        allow: ['edit', 'back'],
        extra: [{ name: 'start', value: 'run' }],
      });

      expect(action).to.eql('edit');
      expect(seen).to.eql([
        ['  config', '← back'],
        ['  edit', '← back'],
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
    }
  });
});
