import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it, pkg, Str } from '../../../-test.ts';
import { EndpointsFs } from '../mod.ts';

describe('EndpointsFs', () => {
  it('fileOf: uses pkg.name dir', () => {
    expect(EndpointsFs.dir).to.eql(`-config/${pkg.name.replace('/', '.')}.deploy`);
  });

  it('fileOf: returns "<dir>/<name>.yaml"', () => {
    expect(EndpointsFs.fileOf('alpha')).to.eql(`${EndpointsFs.dir}/alpha.yaml`);
  });

  it('initialYaml: contains mappings: []', () => {
    const yaml = EndpointsFs.initialYaml();
    expect(yaml.includes('mappings: []')).to.eql(true);
    expect(yaml.includes('# deploy endpoint: alpha')).to.eql(false);
    expect(yaml.includes('siteId: SITE_ID_HERE')).to.eql(true);
    expect(yaml.includes('app: APP_NAME_HERE')).to.eql(true);
    expect(yaml.includes('tokenEnv: TOKEN_ENV_HERE')).to.eql(true);
    expect(yaml.includes('source: ./my-public')).to.eql(true);
  });

  it('ensureInitialYaml: creates file if missing (and parent dir)', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('alpha')}`;

      await EndpointsFs.ensureInitialYaml(path);

      const text = (await Fs.readText(path)).data!;
      expect(text.includes('mappings: []')).to.eql(true);
      expect(text.includes('siteId: SITE_ID_HERE')).to.eql(true);
    });
  });

  it('ensureInitialYaml: does not overwrite if file exists', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('alpha')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const original = '# custom\nmappings: []\n';
      await Fs.write(path, original);

      await EndpointsFs.ensureInitialYaml(path);

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
      const yaml = Str.dedent(`
        staging:
          dir: ./staging
        mappings:
          - mode: build+copy
            dir:
              source: ../../code/sys.ui/ui-components
              staging: sys/ui.components
        `);

      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.write(path, yaml);

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(false);

      if (!res.ok) {
        const rendered = JSON.stringify(res.errors, null, 2);
        expect(rendered.includes('mappings[0].dir.source does not exist')).to.eql(true);
        expect(rendered.includes('resolved:')).to.eql(true);
      }
    });
  });

  it('validateYaml: mapping source exists relative to tool cwd → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      // YAML is in: <tmp>/<dir>/dev.yaml
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('dev')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      // ../code/... from <tmp>/<dir> resolves to: <tmp>/code/...
      const srcAbs = `${tmp}/code/my-modules/ui.foo.bar`;
      await Fs.ensureDir(srcAbs);

      const yaml = Str.dedent(`
        staging: { dir: ./staging }
        mappings:
          - mode: build+copy
            dir:
              source: ./code/my-modules/ui.foo.bar
              staging: dist/my-output
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);

      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: shard templates expand to existing sources → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('shards-ok')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      await Fs.ensureDir(`${tmp}/code/video/partition-0`);
      await Fs.ensureDir(`${tmp}/code/video/partition-1`);

      const yaml = Str.dedent(`
        source:
          dir: ./code
        staging:
          dir: ./staging
        mappings:
          - mode: copy
            shards: { total: 2 }
            dir:
              source: ./video/partition-<shard>
              staging: ./<shard>.video.cdn.example
      `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: shard templates use provider.shards.total → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('provider-shards')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      await Fs.ensureDir(`${tmp}/code/video/partition-0`);
      await Fs.ensureDir(`${tmp}/code/video/partition-1`);

      const yaml = Str.dedent(`
        provider:
          kind: orbiter
          siteId: 123abc
          domain: example.com
          shards: { total: 2 }
        source:
          dir: ./code
        staging:
          dir: ./staging
        mappings:
          - mode: copy
            dir:
              source: ./video/partition-<shard>
              staging: ./<shard>.video.cdn.example
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: rejects provider.shards.only out of range', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('provider-shards-bad')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const yaml = Str.dedent(`
        provider:
          kind: orbiter
          siteId: 123abc
          domain: example.com
          shards:
            total: 2
            only: [3]
        staging:
          dir: ./staging
        mappings: []
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);
    });
  });

  it('validateYaml: rejects provider.shards.siteIds invalid key', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('provider-shards-bad-key')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const yaml = Str.dedent(`
        provider:
          kind: orbiter
          siteId: 123abc
          domain: example.com
          shards:
            total: 2
            siteIds:
              x: 11111111-1111-1111-1111-111111111111
        staging:
          dir: ./staging
        mappings: []
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);
    });
  });

  it('validateYaml: rejects provider.shards.siteIds empty value', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('provider-shards-bad-value')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const yaml = Str.dedent(`
        provider:
          kind: orbiter
          siteId: 123abc
          domain: example.com
          shards:
            total: 2
            siteIds:
              1: ''
        staging:
          dir: ./staging
        mappings: []
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);
    });
  });

  it('validateYaml: shard templates allow sparse dirs by default', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('shards-sparse-ok')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.ensureDir(`${tmp}/code/video/partition-0`);

      const yaml = Str.dedent(`
        source:
          dir: ./code
        staging:
          dir: ./staging
        mappings:
          - mode: copy
            shards: { total: 3 }
            dir:
              source: ./video/partition-<shard>
              staging: ./<shard>.video.cdn.example
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: shard templates require all when configured', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('shards-require-all')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.ensureDir(`${tmp}/code/video/partition-0`);

      const yaml = Str.dedent(`
        source:
          dir: ./code
        staging:
          dir: ./staging
        mappings:
          - mode: copy
            shards: { total: 2, requireAll: true }
            dir:
              source: ./video/partition-<shard>
              staging: ./<shard>.video.cdn.example
      `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);
    });
  });

  it('validateYaml: mapping source respects source.dir base → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('source-base')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      await Fs.ensureDir(`${tmp}/code/my-modules/ui.foo.bar`);

      const yaml = [
        'source:',
        '  dir: ./code',
        'staging:',
        '  dir: ./staging',
        'mappings:',
        '  - mode: build+copy',
        '    dir:',
        '      source: ./my-modules/ui.foo.bar',
        '      staging: dist/my-output',
        '',
      ].join('\n');

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);

      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: refactor-style source.dir resolves mapping → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('refactor')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      await Fs.ensureDir(`${tmp}/repo-root/sys.ui/ui-react-components`);

      const yaml = [
        'source:',
        '  dir: ./repo-root',
        'staging:',
        '  dir: ./staging',
        'mappings:',
        '  - mode: build+copy',
        '    dir:',
        '      source: ./sys.ui/ui-react-components',
        '      staging: dist/ui-react-components',
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
      await Fs.write(path, ['staging:', '  dir: ./staging', 'mappings: []', ''].join('\n'));

      const res = await EndpointsFs.validateYaml(path);
      expect(res.ok).to.eql(true);
      if (res.ok) expect(res.doc.mappings ?? []).to.eql([]);
    });
  });

  it('validateYaml: mapping source exists with "~/" → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('tilde-ok')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const homeDir = tmp;
      const oldHome = Deno.env.get('HOME');
      Deno.env.set('HOME', homeDir);

      try {
        const srcAbs = Fs.Tilde.expand('~/.sys-test/endpointsfs/tilde-src');

        // ensure the directory exists under home for this test
        await Fs.ensureDir(srcAbs);

        const yaml = [
          'staging:',
          '  dir: ./staging',
          'mappings:',
          '  - mode: build+copy',
          '    dir:',
          `      source: ${Fs.Tilde.collapse(srcAbs)}`,
          '      staging: dist/my-output',
          '',
        ].join('\n');

        await Fs.write(yamlPath, yaml);

        const res = await EndpointsFs.validateYaml(yamlPath);
        expect(res.ok).to.eql(true);
      } finally {
        if (oldHome === undefined) {
          Deno.env.delete('HOME');
        } else {
          Deno.env.set('HOME', oldHome);
        }
      }

      await Fs.remove(`${homeDir}/.sys-test`);
    });
  });

  it('validateYaml: staging.dir absolute → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('staging-abs')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const yaml = ['staging:', '  dir: /tmp/staging-abs', 'mappings: []', ''].join('\n');
      await Fs.write(yamlPath, yaml);

      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);

      if (!res.ok) {
        const rendered = JSON.stringify(res.errors, null, 2);
        expect(rendered.includes('staging.dir must be relative')).to.eql(true);
      }
    });
  });

  it("validateYaml: staging.dir contains '..' → ok:false", async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('staging-dotdot')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const yaml = ['staging:', '  dir: ../staging-1', 'mappings: []', ''].join('\n');
      await Fs.write(yamlPath, yaml);

      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);

      if (!res.ok) {
        const rendered = JSON.stringify(res.errors, null, 2);
        expect(rendered.includes("staging.dir must not contain '..'")).to.eql(true);
      }
    });
  });

  it('validateYaml: mapping.dir.staging absolute → ok:false', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('mapping-staging-abs')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const srcAbs = `${tmp}/code/my-modules/ui.foo.bar`;
      await Fs.ensureDir(srcAbs);

      const yaml = [
        'staging:',
        '  dir: ./staging',
        'mappings:',
        '  - mode: copy',
        '    dir:',
        '      source: ../code/my-modules/ui.foo.bar',
        '      staging: /tmp/nope',
        '',
      ].join('\n');

      await Fs.write(yamlPath, yaml);

      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);

      if (!res.ok) {
        const rendered = JSON.stringify(res.errors, null, 2);
        expect(rendered.includes('mappings[0].dir.staging must be relative')).to.eql(true);
      }
    });
  });

  it("validateYaml: mapping.dir.staging contains '..' → ok:false", async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('mapping-staging-dotdot')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const srcAbs = `${tmp}/code/my-modules/ui.foo.bar`;
      await Fs.ensureDir(srcAbs);

      const yaml = [
        'staging:',
        '  dir: ./staging',
        'mappings:',
        '  - mode: copy',
        '    dir:',
        '      source: ../code/my-modules/ui.foo.bar',
        '      staging: ../nope',
        '',
      ].join('\n');

      await Fs.write(yamlPath, yaml);

      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(false);

      if (!res.ok) {
        const rendered = JSON.stringify(res.errors, null, 2);
        expect(rendered.includes("mappings[0].dir.staging must not contain '..'")).to.eql(true);
      }
    });
  });

  it('validateYaml: staging.dir relative → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('staging-rel')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      const srcAbs = `${tmp}/code/my-modules/ui.foo.bar`;
      await Fs.ensureDir(srcAbs);

      const yaml = [
        'staging:',
        '  dir: staging-1',
        'mappings:',
        '  - mode: copy',
        '    dir:',
        '      source: ./code/my-modules/ui.foo.bar',
        '      staging: ui-react-components',
        '',
      ].join('\n');

      await Fs.write(yamlPath, yaml);

      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(true);
    });
  });
});
