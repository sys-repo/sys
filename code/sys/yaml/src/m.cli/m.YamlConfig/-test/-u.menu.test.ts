import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, Obj } from '../common.ts';
import { menu } from '../u/u.menu.ts';

describe('YamlConfig.menu', () => {
  it('menu → creates default config with add init YAML renderer', async () => {
    const cwd = await Fs.makeTempDir();
    const original = Cli.Input.Select.prompt;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: () => Promise.resolve('exit'),
    });

    try {
      const res = await menu({
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
      });

      const text = await Fs.readText(Fs.join(cwd.absolute, '-config/default.yaml'));
      expect(res).to.eql({ kind: 'exit' });
      expect(text.data).to.eql('# config: default\ntitle: Default\n');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Fs.remove(cwd.absolute);
    }
  });

  it('menu → omits the Select message when the label is empty', async () => {
    const cwd = await Fs.makeTempDir();
    const original = Cli.Input.Select.prompt;
    let prompt: { readonly message?: string } | undefined;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: { readonly message?: string }) => {
        prompt = args;
        return Promise.resolve('exit');
      },
    });

    try {
      const res = await menu({
        cwd: cwd.absolute,
        dir: '-config',
        label: '',
        schema: {
          init: () => ({ title: 'Default' }),
          validate: () => ({ ok: true, errors: [] }),
        },
      });

      expect(res).to.eql({ kind: 'exit' });
      expect(Obj.hasOwn(prompt, 'message')).to.eql(false);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Fs.remove(cwd.absolute);
    }
  });

  it('action menu → renders before each submenu transition and preserves two-level back', async () => {
    const cwd = await Fs.makeTempDir();
    const original = Cli.Input.Select.prompt;
    const path = Fs.join(cwd.absolute, '-config/alpha.yaml');
    const seen: string[][] = [];
    const messages: Array<string | undefined> = [];
    const events: string[] = [];

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: {
        readonly message?: string;
        readonly options: readonly {
          readonly name: string;
          readonly value: unknown;
        }[];
      }) => {
        const options = args.options;
        const frame = options.map((option) => Cli.stripAnsi(option.name));
        seen.push(frame);
        messages.push(Obj.hasOwn(args, 'message') ? Cli.stripAnsi(args.message ?? '') : undefined);
        events.push(frame.includes('  edit') ? 'prompt:submenu' : 'prompt:action');
        if (seen.length === 1) {
          return Promise.resolve(
            options.find((option) => option.name === '  config: alpha')?.value,
          );
        }
        return Promise.resolve('back');
      },
    });

    try {
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, 'title: Alpha\n');

      const res = await menu({
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
      });

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
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Fs.remove(cwd.absolute);
    }
  });

  it('action submenu → confirms deletion with the selected config name', async () => {
    const cwd = await Fs.makeTempDir();
    const originalSelect = Cli.Input.Select.prompt;
    const originalConfirm = Cli.Input.Confirm.prompt;
    const path = Fs.join(cwd.absolute, '-config/canon.yaml');
    let confirmation = '';
    let renderCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: {
        readonly options: readonly {
          readonly name: string;
          readonly value: unknown;
        }[];
      }) => {
        const options = args.options;
        const submenu = options.find((option) => Cli.stripAnsi(option.name) === '  config: canon');
        return Promise.resolve(submenu?.value ?? 'delete');
      },
    });
    Object.defineProperty(Cli.Input.Confirm, 'prompt', {
      value: (args: { readonly message: string }) => {
        confirmation = Cli.stripAnsi(args.message);
        return Promise.resolve(true);
      },
    });

    try {
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, 'title: Canon\n');

      const res = await menu({
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
      });

      expect(res).to.eql({ kind: 'back' });
      expect(confirmation).to.eql('Delete canon?');
      expect(renderCount).to.eql(3);
      expect(await Fs.exists(path)).to.eql(false);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalSelect });
      Object.defineProperty(Cli.Input.Confirm, 'prompt', { value: originalConfirm });
      await Fs.remove(cwd.absolute);
    }
  });

  it('menu → supports doc-derived itemLabel row labels', async () => {
    const cwd = await Fs.makeTempDir();
    const original = Cli.Input.Select.prompt;
    const dir = Fs.join(cwd.absolute, '-config');
    let seen: string[] = [];

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (args: { readonly options: readonly { readonly name: string }[] }) => {
        seen = args.options.map((option) => Cli.stripAnsi(option.name));
        return Promise.resolve('exit');
      },
    });

    try {
      await Fs.ensureDir(dir);
      await Fs.write(Fs.join(dir, 'cdn.yaml'), 'provider:\n  kind: orbiter\n');
      await Fs.write(Fs.join(dir, 'assets.yaml'), 'provider:\n  kind: r2\n');

      const res = await menu<{ readonly provider?: { readonly kind?: string } }>({
        cwd: cwd.absolute,
        dir: '-config',
        label: 'endpoints',
        ensureDefault: false,
        itemLabel: ({ doc }) => doc?.provider?.kind ?? 'none',
        schema: {
          validate: () => ({ ok: true, errors: [] }),
        },
      });

      expect(res).to.eql({ kind: 'exit' });
      expect(seen.some((name) => name.startsWith(' orbiter: '))).to.eql(true);
      expect(seen.some((name) => name.startsWith('      r2: '))).to.eql(true);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      await Fs.remove(cwd.absolute);
    }
  });
});
