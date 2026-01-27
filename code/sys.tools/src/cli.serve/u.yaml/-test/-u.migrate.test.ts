import { withTmpDir } from './-fixtures.ts';
import { describe, expect, Fs, it } from '../../../-test.ts';
import { ServeFs, ServeMigrate } from '../mod.ts';

describe('ServeMigrate', () => {
  it('no-op when no legacy JSON config exists', async () => {
    await withTmpDir(async (tmp) => {
      const result = await ServeMigrate.run(tmp);
      expect(result.migrated).to.eql(0);
      expect(result.skipped).to.eql(0);
    });
  });

  it('migrates from -serve.config.json', async () => {
    await withTmpDir(async (tmp) => {
      const legacyConfig = {
        name: 'system/serve:tools',
        dirs: [
          {
            name: 'local',
            dir: '.',
            contentTypes: ['image/png', 'text/html'],
            createdAt: 1234567890,
            lastUsedAt: 1234567899,
          },
        ],
      };
      await Fs.write(`${tmp}/-serve.config.json`, JSON.stringify(legacyConfig, null, 2));

      const result = await ServeMigrate.run(tmp);

      expect(result.migrated).to.eql(1);
      expect(result.skipped).to.eql(0);

      // Legacy file should be deleted.
      expect(await Fs.exists(`${tmp}/-serve.config.json`)).to.eql(false);

      // YAML file should exist.
      const yamlPath = `${tmp}/${ServeFs.fileOf('local')}`;
      expect(await Fs.exists(yamlPath)).to.eql(true);

      // Content should be correct (no timestamps).
      const content = (await Fs.readText(yamlPath)).data!;
      expect(content).to.include('name: local');
      expect(content).to.include('dir: .');
      expect(content).to.include('image/png');
      expect(content).to.include('text/html');
      expect(content).not.to.include('createdAt');
      expect(content).not.to.include('lastUsedAt');
    });
  });

  it('migrates from -config/-serve.config.json', async () => {
    await withTmpDir(async (tmp) => {
      const legacyConfig = {
        name: 'system/serve:tools',
        dirs: [{ name: 'test', dir: './dist' }],
      };
      await Fs.ensureDir(`${tmp}/-config`);
      await Fs.write(`${tmp}/-config/-serve.config.json`, JSON.stringify(legacyConfig));

      const result = await ServeMigrate.run(tmp);

      expect(result.migrated).to.eql(1);

      // Legacy file should be deleted.
      expect(await Fs.exists(`${tmp}/-config/-serve.config.json`)).to.eql(false);

      // YAML should exist.
      expect(await Fs.exists(`${tmp}/${ServeFs.fileOf('test')}`)).to.eql(true);
    });
  });

  it('preserves remoteBundles with lastUsedAt', async () => {
    await withTmpDir(async (tmp) => {
      const legacyConfig = {
        dirs: [
          {
            name: 'with-bundles',
            dir: '.',
            remoteBundles: [
              {
                remote: { dist: 'https://example.com/dist.json' },
                local: { dir: 'bundles/example' },
                lastUsedAt: 1706123456,
              },
            ],
          },
        ],
      };
      await Fs.write(`${tmp}/-serve.config.json`, JSON.stringify(legacyConfig));

      const result = await ServeMigrate.run(tmp);

      expect(result.migrated).to.eql(1);

      const content = (await Fs.readText(`${tmp}/${ServeFs.fileOf('with-bundles')}`)).data!;
      expect(content).to.include('https://example.com/dist.json');
      expect(content).to.include('bundles/example');
      expect(content).to.include('1706123456');
    });
  });

  it('handles multiple locations', async () => {
    await withTmpDir(async (tmp) => {
      const legacyConfig = {
        dirs: [
          { name: 'first', dir: './first' },
          { name: 'second', dir: './second' },
          { name: 'third', dir: './third' },
        ],
      };
      await Fs.write(`${tmp}/-serve.config.json`, JSON.stringify(legacyConfig));

      const result = await ServeMigrate.run(tmp);

      expect(result.migrated).to.eql(3);
      expect(await Fs.exists(`${tmp}/${ServeFs.fileOf('first')}`)).to.eql(true);
      expect(await Fs.exists(`${tmp}/${ServeFs.fileOf('second')}`)).to.eql(true);
      expect(await Fs.exists(`${tmp}/${ServeFs.fileOf('third')}`)).to.eql(true);
    });
  });

  it('handles conflict with incremental suffix', async () => {
    await withTmpDir(async (tmp) => {
      // Create existing YAML file.
      await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
      await Fs.write(`${tmp}/${ServeFs.fileOf('local')}`, 'name: Existing\ndir: .\n');

      const legacyConfig = {
        dirs: [{ name: 'local', dir: './new' }],
      };
      await Fs.write(`${tmp}/-serve.config.json`, JSON.stringify(legacyConfig));

      const result = await ServeMigrate.run(tmp);

      expect(result.migrated).to.eql(1);

      // Original should be unchanged.
      const original = (await Fs.readText(`${tmp}/${ServeFs.fileOf('local')}`)).data;
      expect(original).to.include('name: Existing');

      // New file should have suffix.
      const incremental = (await Fs.readText(`${tmp}/${ServeFs.fileOf('local.01')}`)).data;
      expect(incremental).to.include('dir: ./new');
    });
  });

  it('sanitizes name for filename', async () => {
    await withTmpDir(async (tmp) => {
      const legacyConfig = {
        dirs: [{ name: 'My Server Name', dir: '.' }],
      };
      await Fs.write(`${tmp}/-serve.config.json`, JSON.stringify(legacyConfig));

      const result = await ServeMigrate.run(tmp);

      expect(result.migrated).to.eql(1);
      expect(await Fs.exists(`${tmp}/${ServeFs.fileOf('my-server-name')}`)).to.eql(true);
    });
  });

  it('deletes empty legacy config', async () => {
    await withTmpDir(async (tmp) => {
      const legacyConfig = { name: 'system/serve:tools', dirs: [] };
      await Fs.write(`${tmp}/-serve.config.json`, JSON.stringify(legacyConfig));

      const result = await ServeMigrate.run(tmp);

      expect(result.migrated).to.eql(0);
      expect(result.skipped).to.eql(0);
      expect(await Fs.exists(`${tmp}/-serve.config.json`)).to.eql(false);
    });
  });

  it('omits contentTypes if empty (defaults to all)', async () => {
    await withTmpDir(async (tmp) => {
      const legacyConfig = {
        dirs: [{ name: 'minimal', dir: '.', contentTypes: [] }],
      };
      await Fs.write(`${tmp}/-serve.config.json`, JSON.stringify(legacyConfig));

      await ServeMigrate.run(tmp);

      const content = (await Fs.readText(`${tmp}/${ServeFs.fileOf('minimal')}`)).data!;
      expect(content).not.to.include('contentTypes');
    });
  });
});
