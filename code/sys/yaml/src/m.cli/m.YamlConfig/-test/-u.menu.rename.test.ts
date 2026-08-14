import { describe, expect, it } from '../../../-test.ts';
import { Fs } from '../common.ts';
import { menuPromptDeps } from './u.fixture.menu.ts';
import { renameConfigWith } from '../u/u.menu.rename.ts';

describe('YamlConfig.menu.rename', () => {
  it('keeps the same file when name is unchanged', async () => {
    const dir = await Fs.makeTempDir();
    const file = Fs.join(dir.absolute, 'alpha.yaml');
    try {
      await Fs.write(file, 'test');

      const res = await renameConfigWith(
        file,
        '.yaml',
        menuPromptDeps({ text: () => Promise.resolve('alpha') }),
      );

      expect(res).to.eql(undefined);
      expect(await Fs.exists(file)).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('renames the config file', async () => {
    const dir = await Fs.makeTempDir();
    const file = Fs.join(dir.absolute, 'alpha.yaml');
    try {
      await Fs.write(file, 'test');

      const res = await renameConfigWith(
        file,
        '.yaml',
        menuPromptDeps({ text: () => Promise.resolve('beta') }),
      );
      const next = Fs.join(dir.absolute, 'beta.yaml');

      expect(res).to.eql(next);
      expect(await Fs.exists(next)).to.eql(true);
      expect(await Fs.exists(file)).to.eql(false);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
