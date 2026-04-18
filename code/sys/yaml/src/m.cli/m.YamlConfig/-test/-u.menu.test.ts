import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { menu } from '../u.menu.ts';

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
});
