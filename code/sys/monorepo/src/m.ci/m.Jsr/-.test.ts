import { type t, describe, expect, expectError, Fs, it, Jsr, Testing } from '../../-test.ts';
import { MonorepoCi } from '../mod.ts';

describe('MonorepoCi.Jsr', () => {
  it('builds YAML from ordered module paths', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.text').create();
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(b, 'deno.json'), { name: '@scope/beta', version: '1.0.0' });

    const yaml = await MonorepoCi.Jsr.text({ paths: [a, b] });
    expect(yaml.includes('name: jsr')).to.eql(true);
    expect(yaml.includes('publish module → "@scope/alpha"')).to.eql(true);
    expect(yaml.includes('publish module → "@scope/beta"')).to.eql(true);
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.eql(true);
    expect(yaml.includes(`cd ${a}`)).to.eql(true);
    expect(yaml.includes(`cd ${b}`)).to.eql(true);
    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('- main')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(false);
  });

  it('writes YAML to disk', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.write').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = fs.join('.github/workflows/jsr.yaml');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const res = await MonorepoCi.Jsr.write({ paths: [moduleDir], target });

    expect(res.target).to.eql(target);
    expect(res.count).to.eql(1);
    expect(await Fs.exists(target)).to.eql(true);
    const text = (await Fs.readText(target)).data ?? '';
    expect(text).to.eql(res.yaml);
  });

  it('returns unchanged when the rendered workflow already matches disk', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.sync.unchanged').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = '.github/workflows/jsr.yaml';

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });

    const first = await MonorepoCi.Jsr.sync({ cwd: fs.dir, source: { paths: [moduleDir] }, target });
    expect(first.kind).to.eql('written');

    const second = await MonorepoCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(second.kind).to.eql('unchanged');
    expect(second.target).to.eql(fs.join(target));
    expect(second.count).to.eql(1);
  });

  it('renders explicit push and pull request triggers', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.on').create();
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const yaml = await MonorepoCi.Jsr.text({
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
    const fs = await Testing.dir('MonorepoCi.Jsr.tags').create();
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const yaml = await MonorepoCi.Jsr.text({
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
    const fs = await Testing.dir('MonorepoCi.Jsr.sync').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = '.github/workflows/jsr.yaml';

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    const written = await MonorepoCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(written.kind).to.eql('written');
    expect(written.count).to.eql(1);
    expect(await Fs.exists(fs.join(target))).to.eql(true);

    const removed = await MonorepoCi.Jsr.sync({ cwd: fs.dir, source: { paths: [] }, target });
    expect(removed.kind).to.eql('removed');
    expect(await Fs.exists(fs.join(target))).to.eql(false);

    const skipped = await MonorepoCi.Jsr.sync({ cwd: fs.dir, source: { paths: [] }, target });
    expect(skipped.kind).to.eql('skipped');
  });

  it('preserves caller order for explicit path sources', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.sync.order').create();
    const alpha = fs.join('code/sys/alpha');
    const tmpl = fs.join('code/-tmpl');

    await Fs.writeJson(Fs.join(alpha, 'deno.json'), { name: '@sys/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(tmpl, 'deno.json'), { name: '@sys/tmpl', version: '1.0.0' });

    const written = await MonorepoCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [alpha, tmpl] },
      target: '.github/workflows/jsr.yaml',
    });

    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw new Error('expected written result');
    expect(written.yaml.indexOf('@sys/alpha')).to.be.lessThan(written.yaml.indexOf('@sys/tmpl'));
  });

  it('excludes unnamed modules during root discovery', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.root-filter').create();
    const root = fs.join('code/projects');

    await Fs.writeJson(Fs.join(root, 'alpha/deno.json'), {
      name: '@scope/alpha',
      version: '1.0.0',
    });
    await Fs.writeJson(Fs.join(root, 'beta/deno.json'), { tasks: { build: 'deno task info' } });

    const written = await MonorepoCi.Jsr.sync({
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
    const fs = await Testing.dir('MonorepoCi.Jsr.ahead').create();
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
        const yaml = await MonorepoCi.Jsr.text({
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
    const fs = await Testing.dir('MonorepoCi.Jsr.ahead.behind').create();
    const alpha = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });

    await withPkgVersions({ '@scope/alpha': versions('@scope/alpha', '1.1.0') }, async () => {
      await expectError(
        async () => await MonorepoCi.Jsr.text({ paths: [alpha], versionFilter: 'ahead' }),
        'Local version is behind JSR latest',
      );
    });
  });
});

type VersionsResponse = t.JsrFetch.PkgVersionsResponse;
function unpublished(): VersionsResponse {
  return {
    ...responseBase(),
    ok: true,
    data: undefined,
    error: undefined,
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
