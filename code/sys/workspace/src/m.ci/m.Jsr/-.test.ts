import { describe, expect, expectError, Fs, it, Jsr, type t, Testing } from '../../-test.ts';
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
    expect(yaml.includes('publish_0:')).to.eql(true);
    expect(yaml.includes('name: "pub-1/1: ${{ matrix.name }}"')).to.eql(true);
    expect(yaml.includes('publish module → "${{ matrix.name }}"')).to.eql(true);
    expect(yaml.includes('- name: "@scope/alpha"')).to.eql(true);
    expect(yaml.includes('- name: "@scope/beta"')).to.eql(true);
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.eql(true);
    expect(yaml.includes(`path: "${a}"`)).to.eql(true);
    expect(yaml.includes(`path: "${b}"`)).to.eql(true);
    expect(yaml.includes('cd "${{ matrix.path }}"')).to.eql(true);
    expect(yaml.includes('deno task test --frozen\n')).to.eql(true);
    expect(yaml.includes('deno task test --trace-leaks')).to.eql(false);
    expect(yaml).to.include('uses: actions/checkout@v5');
    expect(yaml).to.include('- name: Verify clean checkout');
    expect(yaml).to.include('- name: Verify clean dependency install');
    expect(yaml).to.include('timeout-minutes: 240');
    expect(yaml).to.include('fail-fast: false');
    expect(yaml).to.include('max-parallel: 4');
    expect(yaml).to.include('concurrency:');
    expect(yaml).to.include('cancel-in-progress: false');
    expect(yaml).to.include('version: "1.0.0"');
    expect(yaml).to.include('expected_pkg_name="${{ matrix.name }}"');
    expect(yaml).to.include('expected_pkg_version="${{ matrix.version }}"');
    expect(yaml).to.include('pkg_name="$(deno eval');
    expect(yaml).to.include('Generated JSR workflow package version is stale');
    expect(yaml).to.include('pkg_meta_url="https://jsr.io/${pkg_name}/${pkg_version}_meta.json"');
    expect(yaml).to.include('pkg_index_url="https://jsr.io/${pkg_name}/meta.json"');
    expect(yaml).to.include('pkg_specifier="jsr:${pkg_name}@${pkg_version}"');
    expect(yaml).to.include('publish_timeout="90s"');
    expect(yaml).to.include('publish_confirm_timeout=180');
    expect(yaml).to.include('jsr_exact_metadata_visible()');
    expect(yaml).to.include('jsr_package_index_visible()');
    expect(yaml).to.include('deno_resolver_visible()');
    expect(yaml).to.include('deno info --reload "$pkg_specifier"');
    expect(yaml).to.include('wait_for_jsr_version()');
    expect(yaml).to.include('if jsr_exact_metadata_visible; then');
    expect(yaml).to.include('timeout --foreground --kill-after=30s "$publish_timeout" deno publish');
    expect(yaml).to.include('if wait_for_jsr_version; then');
    expect(yaml).to.include('deno publish exited successfully; confirming JSR resolver visibility');
    expect(yaml).to.include('deno publish reached bounded wait');
    expect(yaml).to.include('checking JSR resolver visibility');
    expect(yaml).to.include('JSR exact metadata is visible');
    expect(yaml).to.include('JSR package index includes published version');
    expect(yaml).to.include('Deno resolver confirms published version');
    expect(yaml).to.include('JSR resolver confirms published version');
    expect(yaml).to.include('treating publish as successful');
    expect(yaml).to.include('JSR resolver did not confirm published version after attempt');
    expect(yaml).to.include('Published version metadata exists, but JSR resolver visibility was not confirmed');
    expect(yaml).to.include('Publish failed: deno publish did not complete successfully');
    expect(yaml).not.to.include('publish command failed or timed out with exit code');
    expect(yaml).not.to.include('publish completed on JSR despite local exit code');
    expect(yaml).not.to.include('JSR registry confirms published version');
    expect(yaml).to.include('test -z "$(git status --porcelain)"');
    expect(yaml.includes('lfs: true')).to.eql(false);
    expect(yaml.includes('git lfs pull')).to.eql(false);
    expect(yaml.includes('if deno publish; then')).to.eql(false);
    expect(yaml.includes('deno publish --allow-dirty')).to.eql(false);
    expect(yaml.includes('max_attempts=3')).to.eql(true);
    expect(yaml.includes('if deno task install; then')).to.eql(true);
    expect(yaml.includes('dependency install failed')).to.eql(true);
    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('- main')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(false);
  });

  it('renders graph-stratified publish matrix jobs', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.strata');
    const alpha = 'code/sys/alpha';
    const beta = 'code/sys/beta';
    const gamma = 'code/sys/gamma';

    await Fs.writeJson(Fs.join(fs.dir, alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, beta, 'deno.json'), { name: '@scope/beta', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, gamma, 'deno.json'), { name: '@scope/gamma', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, 'deno.graph.json'), {
      graph: {
        orderedPaths: [alpha, beta, gamma],
        edges: [
          { from: alpha, to: gamma },
          { from: beta, to: gamma },
        ],
      },
    });

    const yaml = await WorkspaceCi.Jsr.text({ cwd: fs.dir, paths: [alpha, beta, gamma] });

    expect(yaml.includes('publish_0:')).to.eql(true);
    expect(yaml.includes('publish_1:')).to.eql(true);
    expect(yaml.includes('needs: publish_0')).to.eql(true);
    expect(yaml.indexOf('publish_0:')).to.be.lessThan(yaml.indexOf('publish_1:'));
    expect(yaml.indexOf('@scope/alpha')).to.be.lessThan(yaml.indexOf('publish_1:'));
    expect(yaml.indexOf('@scope/beta')).to.be.lessThan(yaml.indexOf('publish_1:'));
    expect(yaml.indexOf('@scope/gamma')).to.be.greaterThan(yaml.indexOf('publish_1:'));
  });

  it('ignores non-selected graph edges while deriving publish strata', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.strata.non-selected');
    const alpha = 'code/sys/alpha';
    const beta = 'code/sys/beta';

    await Fs.writeJson(Fs.join(fs.dir, alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, beta, 'deno.json'), { name: '@scope/beta', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, 'deno.graph.json'), {
      graph: {
        orderedPaths: [alpha, beta],
        edges: [{ from: 'code/sys/base', to: beta }],
      },
    });

    const yaml = await WorkspaceCi.Jsr.text({ cwd: fs.dir, paths: [alpha, beta] });

    expect(yaml.includes('publish_0:')).to.eql(true);
    expect(yaml.includes('publish_1:')).to.eql(false);
    expect(yaml.indexOf('@scope/alpha')).to.be.lessThan(yaml.indexOf('@scope/beta'));
  });

  it('fails closed when an existing graph snapshot is invalid', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.strata.invalid-graph');
    const alpha = 'code/sys/alpha';

    await Fs.writeJson(Fs.join(fs.dir, alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, 'deno.graph.json'), { graph: { orderedPaths: [], edges: [{}] } });

    await expectError(
      async () => await WorkspaceCi.Jsr.text({ cwd: fs.dir, paths: [alpha] }),
      'Invalid workspace graph snapshot',
    );
  });

  it('fails closed on duplicate selected package paths', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.strata.duplicate');
    const alpha = 'code/sys/alpha';

    await Fs.writeJson(Fs.join(fs.dir, alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });

    await expectError(
      async () => await WorkspaceCi.Jsr.text({ cwd: fs.dir, paths: [alpha, alpha] }),
      'Duplicate JSR publish module path',
    );
  });

  it('fails closed on selected package cycles', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.strata.cycle');
    const alpha = 'code/sys/alpha';
    const beta = 'code/sys/beta';

    await Fs.writeJson(Fs.join(fs.dir, alpha, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, beta, 'deno.json'), { name: '@scope/beta', version: '1.0.0' });
    await Fs.writeJson(Fs.join(fs.dir, 'deno.graph.json'), {
      graph: {
        orderedPaths: [alpha, beta],
        edges: [
          { from: alpha, to: beta },
          { from: beta, to: alpha },
        ],
      },
    });

    await expectError(
      async () => await WorkspaceCi.Jsr.text({ cwd: fs.dir, paths: [alpha, beta] }),
      'Cycle in selected JSR publish graph',
    );
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

  it('fails closed before rendering unsafe package names into publish workflow YAML', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.safe.name');
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha";echo',
      version: '1.0.0',
    });

    await expectError(
      async () => await WorkspaceCi.Jsr.text({ paths: [moduleDir] }),
      'Unsafe workflow package name',
    );
  });

  it('fails closed before rendering unsafe package paths into publish workflow YAML', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.safe.path');
    const moduleDir = fs.join('code/sys/bad;echo');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', version: '1.0.0' });

    await expectError(
      async () => await WorkspaceCi.Jsr.text({ paths: [moduleDir] }),
      'Unsafe workflow package path',
    );
  });

  it('fails closed before rendering unsafe package versions into publish workflow YAML', async () => {
    const fs = await Testing.dir('WorkspaceCi.Jsr.safe.version');
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      version: '1.0.0;echo',
    });

    await expectError(
      async () => await WorkspaceCi.Jsr.text({ paths: [moduleDir] }),
      'Unsafe workflow package version',
    );
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
    expect(WorkspaceCi.Jsr.Is.pkgName('@sys/workspace')).to.eql(true);
    expect(WorkspaceCi.Jsr.Is.pkgName('@tdb/slc-data')).to.eql(true);
    expect(WorkspaceCi.Jsr.Is.pkgName('@sample/proxy')).to.eql(true);
    expect(WorkspaceCi.Jsr.Is.pkgName('sample-proxy')).to.eql(false);
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

type VersionsResponse = t.Registry.Jsr.Fetch.Pkg.VersionsResponse;
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
