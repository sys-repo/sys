import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it } from '../../../-test.ts';
import { EndpointsFs } from '../mod.ts';

describe('EndpointsFs', () => {
  it('fileOf: returns "-endpoints/<name>.yaml"', () => {
    expect(EndpointsFs.fileOf('alpha')).to.eql('-endpoints/alpha.yaml');
  });

  it('initialYaml: contains mappings: []', () => {
    const yaml = EndpointsFs.initialYaml('alpha');
    expect(yaml.includes('mappings: []')).to.eql(true);
  });

  it('ensureInitialYaml: creates file if missing (and parent dir)', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('alpha')}`;

      await EndpointsFs.ensureInitialYaml(path, 'alpha');

      const text = (await Fs.readText(path)).data!;
      expect(text.includes('# deploy endpoint: alpha')).to.eql(true);
      expect(text.includes('mappings: []')).to.eql(true);
    });
  });

  it('ensureInitialYaml: does not overwrite if file exists', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('alpha')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const original = '# custom\nmappings: []\n';
      await Fs.write(path, original);

      await EndpointsFs.ensureInitialYaml(path, 'alpha');

      const text = (await Fs.readText(path)).data;
      expect(text).to.eql(original);
    });
  });

  it('validateYaml: missing file → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('missing')}`;

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });

  it('validateYaml: invalid YAML → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('bad')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      // invalid YAML
      await Fs.write(path, 'mappings: [\n');

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });

  it('validateYaml: schema-invalid YAML → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('schema-bad')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      // structurally valid YAML, but schema-invalid (unknown top-level key)
      await Fs.write(path, 'nope: 123\n');

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });

  it('validateYaml: mapping source missing → ok:false (resolved path included)', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('missing-src')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.write(
        path,
        [
          'mappings:',
          '  - mode: build+copy',
          '    dir:',
          '      source: ../../code/sys.ui/ui-components',
          '      staging: sys/ui.components',
          '',
        ].join('\n'),
      );

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(false);

      if (!res.ok) {
        const rendered = JSON.stringify(res.errors, null, 2);
        expect(rendered.includes('mappings[0].dir.source does not exist')).to.eql(true);
        expect(rendered.includes('resolved:')).to.eql(true);
      }
    });
  });

  it('validateYaml: mapping source exists (relative to yaml dir) → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      // YAML is in: <tmp>/-endpoints/dev.yaml
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('dev')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      // ../code/... from <tmp>/-endpoints resolves to: <tmp>/code/...
      const srcAbs = `${tmp}/code/my-modules/ui.foo.bar`;
      await Fs.ensureDir(srcAbs);

      const yaml = [
        'mappings:',
        '  - mode: build+copy',
        '    dir:',
        '      source: ../code/my-modules/ui.foo.bar',
        '      staging: dist/my-output',
        '',
      ].join('\n');

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);

      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: valid YAML → ok:true with doc', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('ok')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.write(path, 'mappings: []\n');

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(true);
      if (res.ok) expect(res.doc.mappings ?? []).to.eql([]);
    });
  });
});
