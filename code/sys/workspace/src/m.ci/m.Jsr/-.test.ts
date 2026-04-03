import { type t, describe, expect, expectError, Fs, it, Jsr, Testing } from '../../-test.ts';
import { WorkspaceCi } from '../mod.ts';

describe('WorkspaceCi.Jsr', () => {
  it('builds YAML from ordered module paths', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.text');
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(b, 'deno.json'), { name: '@scope/beta', version: '1.0.0' });

    const yaml = await WorkspaceCi.Jsr.text({ paths: [a, b] });
    expect(yaml.includes('name: jsr')).to.eql(true);
    expect(yaml.includes('publish module → "@scope/alpha"')).to.eql(true);
    expect(yaml.includes('publish module → "@scope/beta"')).to.eql(true);
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.eql(true);
    expect(yaml.includes(`cd ${a}`)).to.eql(true);
    expect(yaml.includes(`cd ${b}`)).to.eql(true);
    expect(yaml.includes('max_attempts=3')).to.eql(true);
    expect(yaml.includes('if deno task install; then')).to.eql(true);
    expect(yaml.includes('dependency install failed')).to.eql(true);
    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('- main')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(false);
  });

  it('writes YAML to disk', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.write');
    const moduleDir = fs.join('code/sys/alpha');
    const target = fs.join('.github/workflows/jsr.yaml');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const res = await WorkspaceCi.Jsr.write({ paths: [moduleDir], target });

    expect(res.target).to.eql(target);
    expect(res.count).to.eql(1);
    expect(await Fs.exists(target)).to.eql(true);
    const text = (await Fs.readText(target)).data ?? '';
    expect(text).to.eql(res.yaml);
  });

  it('returns unchanged when the rendered workflow already matches disk', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.sync.unchanged');
    const moduleDir = fs.join('code/sys/alpha');
    const target = '.github/workflows/jsr.yaml';

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });

    const first = await WorkspaceCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(first.kind).to.eql('written');

    const second = await WorkspaceCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(second.kind).to.eql('unchanged');
    expect(second.target).to.eql(fs.join(target));
    expect(second.count).to.eql(1);
  });

  it('renders explicit push and pull request triggers', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.on');
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const yaml = await WorkspaceCi.Jsr.text({
      on: {
        pull_request: { branches: ['main'] },
        push: { branches: ['main', 'sample-branch'] },
      },
      paths: [moduleDir],
    });

    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(true);
    expect(yaml.includes('- sample-branch')).to.eql(true);
  });

  it('renders tag-triggered publish workflows with workflow dispatch', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.tags');
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const yaml = await WorkspaceCi.Jsr.text({
      on: { push: { tags: ['jsr-publish', 'jsr-publish-main'] }, workflow_dispatch: true },
      paths: [moduleDir],
    });

    expect(yaml.includes('tags:')).to.eql(true);
    expect(yaml.includes('- jsr-publish')).to.eql(true);
    expect(yaml.includes('- jsr-publish-main')).to.eql(true);
    expect(yaml.includes('workflow_dispatch:')).to.eql(true);
    expect(yaml.includes('branch-capable publish trigger')).to.eql(true);
    expect(yaml.includes('strict main-only publish trigger')).to.eql(true);
    expect(yaml.includes(`if: github.ref_name == 'jsr-publish-main'`)).to.eql(true);
  });

  it('syncs from explicit paths and removes the workflow when no modules remain', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.sync');
    const moduleDir = fs.join('code/sys/alpha');
    const target = '.github/workflows/jsr.yaml';

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const written = await WorkspaceCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(written.kind).to.eql('written');
    expect(written.count).to.eql(1);
    expect(await Fs.exists(fs.join(target))).to.eql(true);

    const removed = await WorkspaceCi.Jsr.sync({ cwd: fs.dir, source: { paths: [] }, target });
    expect(removed.kind).to.eql('removed');
    expect(await Fs.exists(fs.join(target))).to.eql(false);

    const skipped = await WorkspaceCi.Jsr.sync({ cwd: fs.dir, source: { paths: [] }, target });
    expect(skipped.kind).to.eql('skipped');
  });

  it('preserves caller order for explicit path sources', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.sync.order');
    const alpha = fs.join('code/sys/alpha');
    const tmpl = fs.join('code/-tmpl');

    await Fs.writeJson(Fs.join(alpha, 'deno.json'), { name: '@sys/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(tmpl, 'deno.json'), { name: '@sys/tmpl', version: '1.0.0' });

    const written = await WorkspaceCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [alpha, tmpl] },
      target: '.github/workflows/jsr.yaml',
    });

    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw new Error('expected written result');
    expect(written.yaml.indexOf('@sys/alpha')).to.be.lessThan(written.yaml.indexOf('@sys/tmpl'));
  });

  it('excludes unnamed modules during root discovery', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.root-filter');
    const root = fs.join('code/projects');

    await Fs.writeJson(Fs.join(root, 'alpha/deno.json'), {
      name: '@scope/alpha',
      version: '1.0.0',
    });
    await Fs.writeJson(Fs.join(root, 'beta/deno.json'), { tasks: { build: 'deno task info' } });

    const written = await WorkspaceCi.Jsr.sync({
      cwd: fs.dir,
      source: { root },
      target: '.github/workflows/jsr.yaml',
    });

    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw new Error('expected written result');
    expect(written.count).to.eql(1);
    expect(written.yaml.includes('@scope/alpha')).to.eql(true);
    expect(written.yaml.includes('beta')).to.eql(false);
  });

  it('versionFilter: ahead → includes only unpublished or ahead packages', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.ahead');
    const alpha = fs.join('code/sys/alpha');
    const beta = fs.join('code/sys/beta');
    const gamma = fs.join('code/sys/gamma');

    await Fs.writeJson(Fs.join(alpha, 'deno.json'), { name: '@scope/alpha', version: '1.2.0' });
    await Fs.writeJson(Fs.join(beta, 'deno.json'), { name: '@scope/beta', version: '1.0.0' });
    await Fs.writeJson(Fs.join(gamma, 'deno.json'), { name: '@scope/gamma', version: '1.0.0' });

    await withPkgVersions(
      {
        '@scope/alpha': versions('@scope/alpha', '1.1.0'),
        '@scope/beta': versions('@scope/beta', '1.0.0', { '1.0.0': {} }),
        '@scope/gamma': unpublished(),
      },
      async () => {
        const yaml = await WorkspaceCi.Jsr.text({
          paths: [alpha, beta, gamma],
          versionFilter: 'ahead',
        });

        expect(yaml.includes('@scope/alpha')).to.eql(true);
        expect(yaml.includes('@scope/beta')).to.eql(false);
        expect(yaml.includes('@scope/gamma')).to.eql(true);
        expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/gamma')).to.eql(true);
      },
    );
  });

  it('versionFilter: ahead → throws when local version is behind JSR latest', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.ahead.behind');
    const alpha = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });

    await withPkgVersions({ '@scope/alpha': versions('@scope/alpha', '1.1.0') }, async () => {
      await expectError(
        async () => await WorkspaceCi.Jsr.text({ paths: [alpha], versionFilter: 'ahead' }),
        'Local version is behind JSR latest',
      );
    });
  });

  it('versionFilter: ahead → includes packages that return 404 from JSR versions metadata', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.ahead.unpublished-404');
    const alpha = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });

    await withPkgVersions({ '@scope/alpha': unpublished404('@scope/alpha') }, async () => {
      const yaml = await WorkspaceCi.Jsr.text({
        paths: [alpha],
        versionFilter: 'ahead',
      });

      expect(yaml.includes('@scope/alpha')).to.eql(true);
    });
  });

  it('identifies valid JSR package names', () => {
    expect(WorkspaceCi.Jsr.Is.jsrPkgName('@sys/workspace')).to.eql(true);
    expect(WorkspaceCi.Jsr.Is.jsrPkgName('@tdb/slc-data')).to.eql(true);
    expect(WorkspaceCi.Jsr.Is.jsrPkgName('@sample/proxy')).to.eql(true);
    expect(WorkspaceCi.Jsr.Is.jsrPkgName('sample-proxy')).to.eql(false);
  });

  it('determines whether a local module is publishable to JSR', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.Is.publishable');

    await Fs.writeJson(Fs.join(fs.dir, 'code/sys/workspace/deno.json'), {
      name: '@sys/workspace',
      version: '0.0.1',
    });
    await Fs.writeJson(Fs.join(fs.dir, 'deploy/@tdb.slc/deno.json'), {
      name: '@tdb/slc',
      version: '0.0.0',
    });
    await Fs.writeJson(Fs.join(fs.dir, 'deploy/sample.proxy/deno.json'), {
      name: '@sample/proxy',
      version: '0.0.1',
    });
    await Fs.writeJson(Fs.join(fs.dir, 'deploy/@tdb.slc.fs/deno.json'), {
      name: '@tdb/slc-fs',
      version: '0.0.175',
      private: true,
    });

    const scopes = ['@sys', '@tdb'];

    const Is = WorkspaceCi.Jsr.Is;
    expect(await Is.publishable('code/sys/workspace', fs.dir, { scopes })).to.eql(true);
    expect(await Is.publishable('deploy/@tdb.slc', fs.dir, { scopes })).to.eql(false);
    expect(await Is.publishable('deploy/sample.proxy', fs.dir, { scopes })).to.eql(false);
    expect(await Is.publishable('deploy/sample.proxy', fs.dir)).to.eql(true);
    expect(await Is.publishable('deploy/@tdb.slc.fs', fs.dir, { scopes })).to.eql(false);
    expect(await Is.publishable('code/sys/missing', fs.dir, { scopes })).to.eql(false);
  });
});

type VersionsResponse = t.Registry.Jsr.Fetch.PkgVersionsResponse;
function unpublished(): VersionsResponse {
  return {
    ...responseBase(),
    ok: true,
    data: undefined,
    error: undefined,
  } as unknown as VersionsResponse;
}

function unpublished404(pkgName: string): VersionsResponse {
  return {
    ...responseBase(),
    ok: false,
    status: 404,
    statusText: 'Not Found',
    error: {
      name: 'HttpError',
      message: `HTTP/GET request failed: https://jsr.io/${pkgName}/meta.json`,
      cause: { name: 'HttpError', message: '404 Not Found', status: 404 },
      status: 404,
      statusText: 'Not Found',
      headers: {},
    },
    data: undefined,
  } as unknown as VersionsResponse;
}

function versions(
  pkgName: string,
  latest: string,
  published: Record<string, { yanked?: boolean }> = {},
): VersionsResponse {
  const [scope, name] = pkgName.slice(1).split('/');
  return {
    ...responseBase(),
    ok: true,
    data: { scope, name, latest, versions: published },
    error: undefined,
  } as VersionsResponse;
}

async function withPkgVersions(map: Record<string, VersionsResponse>, fn: () => Promise<void>) {
  const original = Jsr.Fetch.Pkg.versions;
  Jsr.Fetch.Pkg.versions = async (name) => map[name] ?? unpublished();
  try {
    await fn();
  } finally {
    Jsr.Fetch.Pkg.versions = original;
  }
}

function responseBase() {
  return {
    status: 200,
    statusText: 'OK',
    url: 'https://jsr.io',
    headers: new Headers(),
  } as const;
}
