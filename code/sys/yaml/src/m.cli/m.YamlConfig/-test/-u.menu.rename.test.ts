import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { renameConfig } from '../u.menu.rename.ts';

describe('YamlConfig.menu.rename', () => {
  it('keeps the same file when name is unchanged', async () => {
    const dir = await Fs.makeTempDir();
    const file = Fs.join(dir.absolute, 'alpha.yaml');
    await Fs.write(file, 'test');

    const original = Cli.Input.Text.prompt;
    Object.defineProperty(Cli.Input.Text, 'prompt', {
      value: () => Promise.resolve('alpha'),
    });

    try {
      const res = await renameConfig(file, '.yaml');
      expect(res).to.eql(undefined);
      expect(await Fs.exists(file)).to.eql(true);
    } finally {
      Object.defineProperty(Cli.Input.Text, 'prompt', { value: original });
      await Fs.remove(dir.absolute);
    }
  });

  it('renames the config file', async () => {
    const dir = await Fs.makeTempDir();
    const file = Fs.join(dir.absolute, 'alpha.yaml');
    await Fs.write(file, 'test');

    const original = Cli.Input.Text.prompt;
    Object.defineProperty(Cli.Input.Text, 'prompt', {
      value: () => Promise.resolve('beta'),
    });

    try {
      const res = await renameConfig(file, '.yaml');
      const next = Fs.join(dir.absolute, 'beta.yaml');
      expect(res).to.eql(next);
      expect(await Fs.exists(next)).to.eql(true);
      expect(await Fs.exists(file)).to.eql(false);
    } finally {
      Object.defineProperty(Cli.Input.Text, 'prompt', { value: original });
      await Fs.remove(dir.absolute);
    }
  });
});
