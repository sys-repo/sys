import { describe, expect, it } from '../../../-test.ts';
import { Cli, Obj } from '../common.ts';
import { menuPromptDeps, selectName, selectValue } from './u.fixture.menu.ts';
import { promptActionWith } from '../u.menu/u.prompt.ts';

describe('YamlConfig.menu.prompt', () => {
  it('renders extra items with a name function', async () => {
    let seen: { readonly name: string; readonly value: unknown }[] = [];

    await promptActionWith(
      {
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        extra: [{ name: ({ name }) => `run ${name}`, value: 'run' }],
      },
      menuPromptDeps({
        select: (args) => {
          seen = args.options;
          return selectName(args, '  run alpha');
        },
      }),
    );

    expect(seen[0]?.name).to.eql('  run alpha');
  });

  it('keeps a fixed indent for action namespaces', async () => {
    let seen: { readonly name: string; readonly value: unknown }[] = [];

    await promptActionWith(
      {
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        extra: [{ name: 'profile: run', value: 'run' }],
      },
      menuPromptDeps({
        select: (args) => {
          seen = args.options;
          return selectName(args, '  profile: run');
        },
      }),
    );

    expect(seen[0]?.name).to.eql('  profile: run');
    expect(seen[1]?.name).to.eql('  config: edit');
    expect(seen[2]?.name).to.eql('  config: reload');
    expect(seen[3]?.name).to.eql('  config: rename');
  });

  it('places extraAfter items after base actions and before delete/back', async () => {
    let seen: { readonly name: string; readonly value: unknown }[] = [];

    await promptActionWith(
      {
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        extra: [{ name: 'start', value: 'run' }],
        extraAfter: [{ name: 'reload', value: 'sandbox' }],
      },
      menuPromptDeps({
        select: (args) => {
          seen = args.options;
          return selectName(args, '  start');
        },
      }),
    );

    expect(seen.map((item) => Cli.stripAnsi(item.name))).to.eql([
      '  start',
      '  config: edit',
      '  config: reload',
      '  config: rename',
      '  reload',
      ' (delete)',
      '← back',
    ]);
  });

  it('uses a custom base action label', async () => {
    let seen: { readonly name: string; readonly value: unknown }[] = [];
    let message = '';

    await promptActionWith(
      {
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        message: 'Profile:',
        actionLabel: 'profile',
        extra: [{ name: 'open', value: 'run' }],
      },
      menuPromptDeps({
        select: (args) => {
          message = args.message ?? '';
          seen = args.options;
          return selectName(args, '  open');
        },
      }),
    );

    expect(message).to.eql('Profile:');
    expect(seen[0]?.name).to.eql('  open');
    expect(seen[1]?.name).to.eql('  profile: edit');
    expect(seen[2]?.name).to.eql('  profile: reload');
    expect(seen[3]?.name).to.eql('  profile: rename');
  });

  it('resolves default, invalid, and titleless root messages', async () => {
    const seen: { readonly message?: string }[] = [];
    const prompts = menuPromptDeps({
      select: (args) => {
        seen.push(args);
        return selectValue(args, 'back');
      },
    });
    const base = { name: 'alpha', path: '/tmp/alpha.yaml' };

    await promptActionWith({ ...base, valid: true }, prompts);
    await promptActionWith({ ...base, valid: false }, prompts);
    await promptActionWith({ ...base, valid: false, message: 'Profile:' }, prompts);
    await promptActionWith({ ...base, valid: true, message: false }, prompts);
    await promptActionWith({ ...base, valid: false, message: false }, prompts);

    expect(
      seen.map((prompt) =>
        Obj.hasOwn(prompt, 'message') ? Cli.stripAnsi(prompt.message ?? '') : undefined
      ),
    ).to.eql([
      'Actions:',
      'Actions: invalid yaml',
      'Profile: invalid yaml',
      undefined,
      undefined,
    ]);
  });

  it('submenu label mode → restores a base-action default in the submenu', async () => {
    let seen: string[] = [];
    let message = '';
    let defaultValue = '';

    const action = await promptActionWith(
      {
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: true,
        labelMode: 'submenu',
        defaultValue: 'reload',
      },
      menuPromptDeps({
        select: (args) => {
          seen = args.options.map((item) => Cli.stripAnsi(item.name));
          message = Cli.stripAnsi(args.message ?? '');
          defaultValue = String(args.default ?? '');
          return selectValue(args, 'rename');
        },
      }),
    );

    expect(action).to.eql('rename');
    expect(message).to.eql('config');
    expect(defaultValue).to.eql('reload');
    expect(seen).to.eql(['  edit', '  reload', '  rename', ' (delete)', '← back']);
  });

  it('submenu label mode → filters invalid-document actions', async () => {
    const seen: string[][] = [];
    const messages: string[] = [];

    const action = await promptActionWith(
      {
        name: 'alpha',
        path: '/tmp/alpha.yaml',
        valid: false,
        labelMode: 'submenu',
        allow: ['edit', 'back'],
        extra: [{ name: 'start', value: 'run' }],
      },
      menuPromptDeps({
        select: (args) => {
          seen.push(args.options.map((item) => Cli.stripAnsi(item.name)));
          messages.push(Cli.stripAnsi(args.message ?? ''));
          if (seen.length === 1) {
            return selectName(args, '  config');
          }
          return selectValue(args, 'edit');
        },
      }),
    );

    expect(action).to.eql('edit');
    expect(seen).to.eql([
      ['  config', '← back'],
      ['  edit', '← back'],
    ]);
    expect(messages).to.eql(['Actions: invalid yaml', 'config invalid yaml']);
  });
});
