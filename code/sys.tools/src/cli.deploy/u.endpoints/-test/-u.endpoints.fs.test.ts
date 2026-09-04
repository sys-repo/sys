import { withTmpDir } from '../../-test/u.fixture.ts';
import { describe, expect, Fs, it, pkg, Str } from '../../../-test.ts';
import { EndpointsFs } from '../mod.ts';

describe('EndpointsFs', () => {
  it('fileOf: uses pkg.name dir', () => {
    expect(EndpointsFs.dir).to.eql(`-config/${pkg.name.replace('/', '.')}.deploy`);
  });

  it('fileOf: returns "<dir>/<name>.yaml"', () => {
    expect(EndpointsFs.fileOf('alpha')).to.eql(`${EndpointsFs.dir}/alpha.yaml`);
  });

  it('initialYaml: contains the supported staged mapping scaffold', () => {
    const yaml = EndpointsFs.initialYaml();
    expect(yaml.includes('mappings: []')).to.eql(true);
    expect(yaml.includes('# deploy endpoint: alpha')).to.eql(false);
    expect(yaml.includes('# provider:')).to.eql(false);
    expect(yaml.includes('app: APP_NAME_HERE')).to.eql(false);
    expect(yaml.includes('tokenEnv: TOKEN_ENV_HERE')).to.eql(false);
    expect(yaml.includes('source: ./my-public')).to.eql(true);
  });

  it('ensureInitialYaml: creates file if missing (and parent dir)', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('alpha')}`;

      await EndpointsFs.ensureInitialYaml(path);

      const text = (await Fs.readText(path)).data!;
      expect(text.includes('mappings: []')).to.eql(true);
      expect(text.includes('# provider:')).to.eql(false);
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

  it('validateYaml: admits index sources produced later under staging', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('staged-index')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.ensureDir(`${tmp}/src/site`);
      await Fs.write(`${tmp}/src/site/a.txt`, 'a');
      await Fs.write(
        yamlPath,
        Str.dedent(`
          staging:
            dir: ./staging
          mappings:
            - mode: copy
              dir:
                source: ./src/site
                staging: ./nested
            - mode: index
              dir:
                source: ./nested
                staging: ./landing
        `),
      );

      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(true);
      expect(await Fs.exists(`${tmp}/staging/nested`)).to.eql(false);
    });
  });

  it('validateYaml: resolves env refs in providerless string leaves before validation', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('env-stage')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.ensureDir(`${tmp}/src/site`);
      await Fs.write(
        `${tmp}/.env`,
        'SAMPLE_DEPLOY_SOURCE="./src/site"\nSAMPLE_DEPLOY_STAGE="./stage"\n',
      );

      const yaml = Str.dedent(`
        staging:
          dir: \${env:SAMPLE_DEPLOY_STAGE}
        mappings:
          - mode: copy
            dir:
              source: \${env:SAMPLE_DEPLOY_SOURCE}
              staging: .
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);

      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.doc.staging?.dir).to.eql('./stage');
        expect(res.doc.mappings?.[0]?.dir.source).to.eql('./src/site');
      }
    });
  });

  it('validateYaml: resolves r2 provider env refs before validation', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('env-r2')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.write(
        `${tmp}/.env`,
        'SAMPLE_DEPLOY_R2_ACCOUNT_ID="account-1"\nSAMPLE_DEPLOY_R2_BUCKET="deploy-bucket"\n',
      );

      const yaml = Str.dedent(`
        provider:
          kind: r2
          accountId: \${env:SAMPLE_DEPLOY_R2_ACCOUNT_ID}
          bucket: \${env:SAMPLE_DEPLOY_R2_BUCKET}
          prefix: deploy/site
          credentials:
            accessKeyId: key-1
            secretAccessKey: secret-1
        staging:
          dir: ./staging
        mappings: []
        `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);

      expect(res.ok).to.eql(true);
      if (res.ok && res.doc.provider?.kind === 'r2') {
        expect(res.doc.provider.accountId).to.eql('account-1');
        expect(res.doc.provider.bucket).to.eql('deploy-bucket');
      }
    });
  });

  it('validateYaml: missing env ref fails before schema/provider validation', async () => {
    const key = 'SAMPLE_DEPLOY_MISSING_ACCOUNT_ID';
    await withoutProcessEnv(key, async () => {
      await withTmpDir(async (tmp) => {
        const yamlPath = `${tmp}/${EndpointsFs.fileOf('env-missing')}`;
        await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

        const yaml = Str.dedent(`
          provider:
            kind: r2
            accountId: \${env:${key}}
            bucket: deploy-bucket
            prefix: deploy/site
            credentials:
              accessKeyId: key-1
              secretAccessKey: secret-1
          staging:
            dir: ./staging
          mappings: []
          `);

        await Fs.write(yamlPath, yaml);
        const res = await EndpointsFs.validateYaml(yamlPath);

        expect(res.ok).to.eql(false);
        if (!res.ok) {
          const rendered = JSON.stringify(res.errors, null, 2);
          expect(rendered.includes(`provider.accountId references missing env var: ${key}`)).to.eql(
            true,
          );
        }
      });
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

      const yaml = Str.dedent(`
        source:
          dir: ./code
        staging:
          dir: ./staging
        mappings:
          - mode: build+copy
            dir:
              source: ./my-modules/ui.foo.bar
              staging: dist/my-output
      `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);

      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: refactor-style source.dir resolves mapping → ok:true', async () => {
    await withTmpDir(async (tmp) => {
      const yamlPath = `${tmp}/${EndpointsFs.fileOf('refactor')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);

      await Fs.ensureDir(`${tmp}/repo-root/sys.ui/ui-components`);

      const yaml = Str.dedent(`
        source:
          dir: ./repo-root
        staging:
          dir: ./staging
        mappings:
          - mode: build+copy
            dir:
              source: ./sys.ui/ui-components
              staging: dist/ui-components
      `);

      await Fs.write(yamlPath, yaml);
      const res = await EndpointsFs.validateYaml(yamlPath);

      expect(res.ok).to.eql(true);
    });
  });

  it('validateYaml: valid YAML → ok:true with doc', async () => {
    await withTmpDir(async (tmp) => {
      const path = `${tmp}/${EndpointsFs.fileOf('ok')}`;
      await Fs.ensureDir(`${tmp}/${EndpointsFs.dir}`);
      await Fs.write(
        path,
        Str.dedent(`
        staging:
          dir: ./staging
        mappings: []
      `),
      );

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

        const yaml = Str.dedent(`
          staging:
            dir: ./staging
          mappings:
            - mode: build+copy
              dir:
                source: ${Fs.Tilde.collapse(srcAbs)}
                staging: dist/my-output
        `);

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

      const yaml = Str.dedent(`
        staging:
          dir: /tmp/staging-abs
        mappings: []
      `);
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

      const yaml = Str.dedent(`
        staging:
          dir: ../staging-1
        mappings: []
      `);
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

      const yaml = Str.dedent(`
        staging:
          dir: ./staging
        mappings:
          - mode: copy
            dir:
              source: ../code/my-modules/ui.foo.bar
              staging: /tmp/nope
      `);

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

      const yaml = Str.dedent(`
        staging:
          dir: ./staging
        mappings:
          - mode: copy
            dir:
              source: ../code/my-modules/ui.foo.bar
              staging: ../nope
      `);

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

      const yaml = Str.dedent(`
        staging:
          dir: staging-1
        mappings:
          - mode: copy
            dir:
              source: ./code/my-modules/ui.foo.bar
              staging: ui-components
      `);

      await Fs.write(yamlPath, yaml);

      const res = await EndpointsFs.validateYaml(yamlPath);
      expect(res.ok).to.eql(true);
    });
  });
});

/**
 * Helpers:
 */
const withoutProcessEnv = async (key: string, fn: () => Promise<void>) => {
  const original = Deno.env.get(key);
  Deno.env.delete(key);
  try {
    await fn();
  } finally {
    if (original != null) Deno.env.set(key, original);
  }
};
