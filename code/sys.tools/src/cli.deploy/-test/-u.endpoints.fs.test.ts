import { describe, it, expect, Fs } from '../../-test.ts';
import { EndpointsFs } from '../u.endpoints.fs.ts';

const withTmpDir = async <T>(
  fn: (dir: string) => Promise<T>,
  options?: { readonly prefix?: string; readonly suffix?: string },
): Promise<T> => {
  const dir = await Fs.makeTempDir({ prefix: options?.prefix ?? 'sys.tools.deploy.' });
  try {
    return await fn(dir.absolute);
  } finally {
    await Fs.remove(dir.absolute);
  }
};

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

  it('validateYaml: missing file -> ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('missing')}`;

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(false);
      if (!res.ok) expect(res.errors.length > 0).to.eql(true);
    });
  });

  it('validateYaml: invalid YAML -> ok:false', async () => {
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

  it('validateYaml: schema-invalid YAML -> ok:false', async () => {
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

  it('validateYaml: valid YAML -> ok:true with doc', async () => {
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
