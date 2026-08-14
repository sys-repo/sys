import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, Is, Obj } from '../common.ts';
import { menuPromptDeps, selectName, selectValue } from './u.fixture.menu.ts';
import { menu, menuWith } from '../u/u.menu.ts';
import { defaultMenuPrompts } from '../u/u.menu.prompts.ts';

describe('YamlConfig.menu', () => {
  it('menu → creates default config with add init YAML renderer', async () => {
    const cwd = await Fs.makeTempDir();
    try {
      const res = await menuWith({
        cwd: cwd.absolute,
        dir: '-config',
        label: 'Configs',
        schema: {
          init: () => ({ title: 'Default' }),
          validate: () => ({ ok: true, errors: [] }),
        },
        add: {
          initYaml: ({ name }) => `# config: ${name}\ntitle: Default\n`,
        },
      }, menuPromptDeps({ select: (args) => selectValue(args, 'exit') }));

      const text = await Fs.readText(Fs.join(cwd.absolute, '-config/default.yaml'));
      expect(res).to.eql({ kind: 'exit' });
      expect(text.data).to.eql('# config: default\ntitle: Default\n');
    } finally {
      await Fs.remove(cwd.absolute);
    }
  });

  it('menu → composes the canonical Select prompt by default', async () => {
    const cwd = await Fs.makeTempDir();
    Cli.Prompt.Select.inject('exit');
    try {
      const res = await menu({
        cwd: cwd.absolute,
        dir: '-config',
        label: 'Configs',
        ensureDefault: false,
        schema: { validate: () => ({ ok: true, errors: [] }) },
      });

      expect(res).to.eql({ kind: 'exit' });
    } finally {
      Cli.Prompt.Select.inject(undefined);
      await Fs.remove(cwd.absolute);
    }
  });

  it('menu prompt defaults retain canonical text and confirm operations', () => {
    const prompts = defaultMenuPrompts();

    expect(prompts.text).to.equal(Cli.Input.Text.prompt);
    expect(prompts.confirm).to.equal(Cli.Input.Confirm.prompt);
  });

  it('menu → omits the Select message when the label is empty', async () => {
    const cwd = await Fs.makeTempDir();
    let prompt: { readonly message?: string } | undefined;
    try {
      const res = await menuWith(
        {
          cwd: cwd.absolute,
          dir: '-config',
          label: '',
          schema: {
            init: () => ({ title: 'Default' }),
            validate: () => ({ ok: true, errors: [] }),
          },
        },
        menuPromptDeps({
          select: (args) => {
            prompt = args;
            return selectValue(args, 'exit');
          },
        }),
      );

      expect(res).to.eql({ kind: 'exit' });
      expect(Obj.hasOwn(prompt, 'message')).to.eql(false);
    } finally {
      await Fs.remove(cwd.absolute);
    }
  });

  it('action menu → renders before each submenu transition and preserves two-level back', async () => {
    const cwd = await Fs.makeTempDir();
    const path = Fs.join(cwd.absolute, '-config/alpha.yaml');
    const seen: string[][] = [];
    const messages: Array<string | undefined> = [];
    const events: string[] = [];
    try {
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, 'title: Alpha\n');

      const res = await menuWith(
        {
          cwd: cwd.absolute,
          dir: '-config',
          label: '',
          mode: 'action',
          path,
          beforePrompt: () => {
            events.push('render');
          },
          schema: {
            validate: () => ({ ok: true, errors: [] }),
          },
          actions: {
            message: false,
            label: ({ name }) => `config: ${name}`,
            labelMode: 'submenu',
            deleteLabel: 'delete config',
          },
        },
        menuPromptDeps({
          select: (args) => {
            const frame = args.options.map((option) => Cli.stripAnsi(option.name));
            seen.push(frame);
            messages.push(
              Obj.hasOwn(args, 'message') ? Cli.stripAnsi(args.message ?? '') : undefined,
            );
            events.push(frame.includes('  edit') ? 'prompt:submenu' : 'prompt:action');
            if (seen.length === 1) {
              return selectName(args, '  config: alpha');
            }
            return selectValue(args, 'back');
          },
        }),
      );

      expect(res).to.eql({ kind: 'back' });
      expect(seen).to.eql([
        ['  config: alpha', '← back'],
        ['  edit', '  reload', '  rename', '  delete config', '← back'],
        ['  config: alpha', '← back'],
      ]);
      expect(messages).to.eql([undefined, 'config: alpha', undefined]);
      expect(events).to.eql([
        'render',
        'prompt:action',
        'render',
        'prompt:submenu',
        'render',
        'prompt:action',
      ]);
    } finally {
      await Fs.remove(cwd.absolute);
    }
  });

  it('action submenu → confirms deletion with the selected config name', async () => {
    const cwd = await Fs.makeTempDir();
    const path = Fs.join(cwd.absolute, '-config/canon.yaml');
    let confirmation = '';
    let renderCount = 0;
    try {
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, 'title: Canon\n');

      const res = await menuWith(
        {
          cwd: cwd.absolute,
          dir: '-config',
          label: '',
          mode: 'action',
          path,
          beforePrompt: () => {
            renderCount += 1;
          },
          schema: {
            validate: () => ({ ok: true, errors: [] }),
          },
          actions: {
            label: ({ name }) => `config: ${name}`,
            labelMode: 'submenu',
            deleteLabel: 'delete config',
          },
        },
        menuPromptDeps({
          select: (args) =>
            args.options.some((option) => Cli.stripAnsi(option.name) === '  config: canon')
              ? selectName(args, '  config: canon')
              : selectValue(args, 'delete'),
          confirm: (args) => {
            confirmation = Cli.stripAnsi(Is.string(args) ? args : args.message);
            return Promise.resolve(true);
          },
        }),
      );

      expect(res).to.eql({ kind: 'back' });
      expect(confirmation).to.eql('Delete canon?');
      expect(renderCount).to.eql(3);
      expect(await Fs.exists(path)).to.eql(false);
    } finally {
      await Fs.remove(cwd.absolute);
    }
  });

  it('menu → supports doc-derived itemLabel row labels', async () => {
    const cwd = await Fs.makeTempDir();
    const dir = Fs.join(cwd.absolute, '-config');
    let seen: string[] = [];
    try {
      await Fs.ensureDir(dir);
      await Fs.write(Fs.join(dir, 'cdn.yaml'), 'provider:\n  kind: orbiter\n');
      await Fs.write(Fs.join(dir, 'assets.yaml'), 'provider:\n  kind: r2\n');

      const res = await menuWith<{ readonly provider?: { readonly kind?: string } }>(
        {
          cwd: cwd.absolute,
          dir: '-config',
          label: 'endpoints',
          ensureDefault: false,
          itemLabel: ({ doc }) => doc?.provider?.kind ?? 'none',
          schema: {
            validate: () => ({ ok: true, errors: [] }),
          },
        },
        menuPromptDeps({
          select: (args) => {
            seen = args.options.map((option) => Cli.stripAnsi(option.name));
            return selectValue(args, 'exit');
          },
        }),
      );

      expect(res).to.eql({ kind: 'exit' });
      expect(seen.some((name) => name.startsWith(' orbiter: '))).to.eql(true);
      expect(seen.some((name) => name.startsWith('      r2: '))).to.eql(true);
    } finally {
      await Fs.remove(cwd.absolute);
    }
  });
});
