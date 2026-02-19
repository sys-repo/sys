import { withTmpDir } from './-fixtures.ts';
import { describe, expect, Fs, it, pkg, Str } from '../../../-test.ts';
import { ServeFs } from '../mod.ts';

describe('ServeFs', () => {
  it('fileOf: uses pkg.name dir', () => {
    expect(ServeFs.dir).to.eql(`-config/${pkg.name.replace('/', '.')}.serve`);
  });

  it('fileOf: returns "<dir>/<name>.yaml"', () => {
    expect(ServeFs.fileOf('alpha')).to.eql(`${ServeFs.dir}/alpha.yaml`);
    expect(ServeFs.fileOf('my-server')).to.eql(`${ServeFs.dir}/my-server.yaml`);
  });

  it('initialYaml: contains name and dir', () => {
    const yaml = ServeFs.initialYaml('alpha');
    expect(yaml.includes('name: alpha')).to.eql(true);
    expect(yaml.includes('dir: .')).to.eql(true);
  });

  it('initialYaml: contains comment header', () => {
    const yaml = ServeFs.initialYaml('test');
    expect(yaml.includes('# serve location: test')).to.eql(true);
  });

  it('ensureInitialYaml: creates file if missing (and parent dir)', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${ServeFs.fileOf('alpha')}`;

      await ServeFs.ensureInitialYaml(path, 'alpha');

      const text = (await Fs.readText(path)).data!;
      expect(text.includes('# serve location: alpha')).to.eql(true);
      expect(text.includes('name: alpha')).to.eql(true);
      expect(text.includes('dir: .')).to.eql(true);
    });
  });

  it('ensureInitialYaml: does not overwrite if file exists', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${ServeFs.fileOf('alpha')}`;
      await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);

      const original = '# custom\nname: custom\ndir: .\n';
      await Fs.write(path, original);

      await ServeFs.ensureInitialYaml(path, 'alpha');

      const text = (await Fs.readText(path)).data;
      expect(text).to.eql(original);
    });
  });

  it('validateYaml: missing file → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${ServeFs.fileOf('missing')}`;

      const res = await ServeFs.validateYaml(path);
      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });

  it('validateYaml: invalid YAML syntax → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${ServeFs.fileOf('bad')}`;
      await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);

      // invalid YAML
      await Fs.write(path, 'name: [\n');

      const res = await ServeFs.validateYaml(path);
      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });

  it('validateYaml: schema-invalid YAML → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${ServeFs.fileOf('schema-bad')}`;
      await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);

      // structurally valid YAML, but schema-invalid (unknown top-level key)
      await Fs.write(path, 'nope: 123\n');

      const res = await ServeFs.validateYaml(path);
      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });

  it('validateYaml: valid YAML → ok:true with doc', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${ServeFs.fileOf('ok')}`;
      await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
      await Fs.write(path, ['name: Test', 'dir: .', ''].join('\n'));

      const res = await ServeFs.validateYaml(path);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.doc.name).to.eql('Test');
        expect(res.doc.dir).to.eql('.');
      }
    });
  });

  describe('loadLocation', () => {
    it('resolves dir: . → project root (cwd)', async () => {
      await withTmpDir(async (tmp) => {
        const yamlPath = `${tmp}/${ServeFs.fileOf('test')}`;
        await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
        await Fs.write(yamlPath, ['name: Test', 'dir: .', ''].join('\n'));

        const res = await ServeFs.loadLocation(yamlPath);
        expect(res.ok).to.eql(true);
        if (res.ok) {
          // cwd should be 2 levels up from YAML = tmp
          expect(res.cwd).to.eql(tmp);
          // dir: . resolves to tmp (the project root)
          expect(res.location.dir).to.eql(tmp);
          expect(res.location.name).to.eql('Test');
        }
      });
    });

    it('resolves dir: ./dist → <cwd>/dist', async () => {
      await withTmpDir(async (tmp) => {
        // Create realistic structure:
        // <tmp>/                     ← project root (cwd)
        // ├── dist/                  ← target of dir: ./dist
        // └── -config/serve/test.yaml

        await Fs.ensureDir(`${tmp}/dist`);
        const yamlPath = `${tmp}/${ServeFs.fileOf('test')}`;
        await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
        await Fs.write(yamlPath, ['name: Test', 'dir: ./dist', ''].join('\n'));

        const res = await ServeFs.loadLocation(yamlPath);
        expect(res.ok).to.eql(true);
        if (res.ok) {
          expect(res.cwd).to.eql(tmp);
          expect(res.location.dir).to.eql(`${tmp}/dist`);
        }
      });
    });

    it('preserves absolute paths', async () => {
      await withTmpDir(async (tmp) => {
        const yamlPath = `${tmp}/${ServeFs.fileOf('test')}`;
        await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
        await Fs.write(yamlPath, ['name: Test', 'dir: /absolute/path', ''].join('\n'));

        const res = await ServeFs.loadLocation(yamlPath);
        expect(res.ok).to.eql(true);
        if (res.ok) {
          expect(res.location.dir).to.eql('/absolute/path');
        }
      });
    });

    it('rejects removed contentTypes key when present', async () => {
      await withTmpDir(async (tmp) => {
        const yamlPath = `${tmp}/${ServeFs.fileOf('test')}`;
        await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
        await Fs.write(
          yamlPath,
          Str.dedent(`
            name: Test
            dir: .
            contentTypes:
              - image/png
              - application/json
          `).trimStart(),
        );

        const res = await ServeFs.loadLocation(yamlPath);
        expect(res.ok).to.eql(false);
        if (!res.ok) expect(res.errors.length > 0).to.eql(true);
      });
    });

    it('rejects removed remoteBundles key when present', async () => {
      await withTmpDir(async (tmp) => {
        const yamlPath = `${tmp}/${ServeFs.fileOf('test')}`;
        await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
        const yaml = Str.dedent(`
          name: Test
          dir: .
          remoteBundles:
            - remote:
                dist: https://example.com/dist.json
              local:
                dir: bundles/example
        `).trimStart();
        await Fs.write(yamlPath, yaml);

        const res = await ServeFs.loadLocation(yamlPath);
        expect(res.ok).to.eql(false);
        if (!res.ok) expect(res.errors.length > 0).to.eql(true);
      });
    });

    it('returns error for missing file', async () => {
      await withTmpDir(async (tmp) => {
        const yamlPath = `${tmp}/${ServeFs.fileOf('missing')}`;

        const res = await ServeFs.loadLocation(yamlPath);
        expect(res.ok).to.eql(false);
        if (!res.ok) {
          expect(res.errors.length).to.be.greaterThan(0);
        }
      });
    });

    it('returns error for invalid YAML', async () => {
      await withTmpDir(async (tmp) => {
        const yamlPath = `${tmp}/${ServeFs.fileOf('invalid')}`;
        await Fs.ensureDir(`${tmp}/${ServeFs.dir}`);
        await Fs.write(yamlPath, 'invalid: [\n');

        const res = await ServeFs.loadLocation(yamlPath);
        expect(res.ok).to.eql(false);
        if (!res.ok) {
          expect(res.errors.length).to.be.greaterThan(0);
        }
      });
    });
  });
});
