import { Yaml } from '@sys/yaml';
import { describe, Err, expect, expectError, Fs, it, Testing } from '../../-test.ts';
import { WorkspaceCi } from '../mod.ts';
import { CI_DENO_VERSION } from '../u.deno.ts';

describe('WorkspaceCi.Test.Linux', () => {
  it('builds matrix YAML from ordered module paths', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.text');
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task info' },
    });
    await Fs.writeJson(Fs.join(b, 'deno.json'), {
      name: '@scope/beta',
      tasks: { test: 'deno task info', 'test:browser': 'deno task info' },
      'x-sys': { ci: { test: { browser: true } } },
    });

    const yaml = await WorkspaceCi.Test.Linux.text({ paths: [a, b] });
    const parsed = Yaml.parse<WorkflowDoc>(yaml);
    expect(parsed.error).to.eql(undefined);
    const doc = parsed.data;
    if (!doc) throw Err.std('Expected parsed Linux workflow');

    const graph = doc.jobs.graph;
    const deno = doc.jobs.deno;
    expect(graph['runs-on']).to.eql('ubuntu-latest');
    expect(graph.permissions).to.eql({ contents: 'read' });
    expect(graph.environment).to.eql(undefined);
    expect(graph.env).to.eql(undefined);
    expect(graph.strategy).to.eql(undefined);
    expect(graph.steps.map((step) => step.name ?? step.uses)).to.eql([
      'actions/checkout@v5',
      'Install ESM Runtime: Deno 2.x',
      'Install Dependencies',
      'Verify workspace graph',
    ]);
    expect(graph.steps[1]?.with).to.eql({ 'deno-version': CI_DENO_VERSION });
    expect(graph.steps[2]?.run).to.eql('deno task install');
    expect(graph.steps[3]?.run).to.eql('deno task check:graph');
    expect(deno.needs).to.eql('graph');
    expect(deno.steps.some((step) => step.run === 'deno task check:graph')).to.eql(false);
    expect(
      [...graph.steps, ...deno.steps].filter((step) => step.run === 'deno task check:graph').length,
    ).to.eql(1);

    const incl = (value: string) => yaml.includes(value);

    expect(incl('name: test:linux')).to.be.true;
    expect(incl('test module → "${{ matrix.name }}"')).to.be.true;
    expect(incl('name: ${{ matrix.name }}')).to.be.true;
    expect(incl(`path: ${a}`)).to.be.true;
    expect(incl('name: "@scope/alpha"')).to.be.true;
    expect(incl(`path: ${b}`)).to.be.true;
    expect(incl('name: "@scope/beta"')).to.be.true;
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.be.true;
    expect(incl('Configure Browser Runtime: Chrome')).to.be.true;
    expect(incl('if: ${{ matrix.browser == true }}')).to.be.true;
    expect(incl('browser-actions/setup-chrome@v1')).to.be.false;
    expect(incl('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24')).to.be.false;
    expect(incl('for bin in google-chrome google-chrome-stable chromium chromium-browser')).to.be
      .true;
    expect(incl('path="$(realpath -- "$(command -v "$bin")")"')).to.be.true;
    expect(incl('case "$path" in')).to.be.true;
    expect(incl('Chrome executable path is unsafe for Deno permission transport')).to.be.true;
    expect(incl('printf \'CHROME_BIN=%s\\n\' "$path" >> "$GITHUB_ENV"')).to.be.true;
    expect(incl('browser: true')).to.be.true;
    expect(incl('Verify workspace graph')).to.be.true;
    expect(incl('run: deno task check:graph')).to.be.true;
    expect(incl('deno task test')).to.be.true;
    expect(incl('browser test module → "${{ matrix.name }}"')).to.be.true;
    expect(incl('deno task test:browser')).to.be.true;
    expect(incl('max_attempts=3')).to.be.true;
    expect(incl('if deno task install; then')).to.be.true;
    expect(incl('dependency install failed')).to.be.true;
    expect(incl('push:')).to.be.true;
    expect(incl('- main')).to.be.true;
    expect(incl('pull_request:')).to.be.false;
  });

  it('browser marker without an explicit browser task → fails closed', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.browser-task');
    const moduleDir = fs.join('code/sys/browser-missing-task');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/browser-missing-task',
      tasks: { test: 'deno task info' },
      'x-sys': { ci: { test: { browser: true } } },
    });

    await expectError(
      async () => await WorkspaceCi.Test.Linux.text({ paths: [moduleDir] }),
      'Browser-marked module is missing task "test:browser"',
    );
  });

  it('writes YAML to disk', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.write');
    const moduleDir = fs.join('code/sys/alpha');
    const target = fs.join('.github/workflows/test.yaml');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task info' },
    });
    const res = await WorkspaceCi.Test.Linux.write({ paths: [moduleDir], target });

    expect(res.target).to.eql(target);
    expect(res.count).to.eql(1);
    expect(await Fs.exists(target)).to.be.true;
    const text = (await Fs.readText(target)).data ?? '';
    expect(text).to.eql(res.yaml);
  });

  it('fails closed before rendering unsafe matrix values into test workflow YAML', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.safe');
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha";echo',
      tasks: { test: 'deno task info' },
    });

    await expectError(
      async () => await WorkspaceCi.Test.Linux.text({ paths: [moduleDir] }),
      'Unsafe workflow matrix name',
    );
  });

  it('returns unchanged when the rendered workflow already matches disk', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.sync.unchanged');
    const moduleDir = fs.join('code/sys/alpha');
    const target = '.github/workflows/test.yaml';

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task info' },
    });

    const first = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(first.kind).to.eql('written');

    const second = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(second.kind).to.eql('unchanged');
    expect(second.target).to.eql(fs.join(target));
    expect(second.count).to.eql(1);
  });

  it('renders explicit push and pull request triggers', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.on');
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task info' },
    });
    const yaml = await WorkspaceCi.Test.Linux.text({
      on: {
        pull_request: { branches: ['main'], paths_ignore: ['.github/workflows/jsr.yaml'] },
        push: {
          branches: ['main', 'sample-branch'],
          paths_ignore: ['.github/workflows/jsr.yaml'],
        },
      },
      paths: [moduleDir],
    });

    expect(yaml.includes('push:')).to.be.true;
    expect(yaml.includes('pull_request:')).to.be.true;
    expect(yaml.includes('- sample-branch')).to.be.true;
    expect(yaml.includes('paths-ignore:')).to.be.true;
    expect(yaml.includes('.github/workflows/jsr.yaml')).to.be.true;
  });

  it('falls back to the module path when name is missing', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.path-fallback');
    const moduleDir = fs.join('code/projects/demo');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { tasks: { test: 'deno task info' } });
    const yaml = await WorkspaceCi.Test.Linux.text({ paths: [moduleDir] });

    expect(yaml.includes(`name: "${moduleDir}"`)).to.be.true;
  });

  it('syncs from a source root and removes the workflow when no test modules exist', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.sync');
    const root = fs.join('code/projects');
    const target = '.github/workflows/test.yaml';

    await Fs.writeJson(Fs.join(root, 'alpha/deno.json'), { tasks: { test: 'deno task info' } });
    await Fs.writeJson(Fs.join(root, 'beta/deno.json'), { tasks: { build: 'deno task info' } });

    const written = await WorkspaceCi.Test.Linux.sync({ cwd: fs.dir, source: { root }, target });
    expect(written.kind).to.eql('written');
    expect(written.count).to.eql(1);
    expect(await Fs.exists(fs.join(target))).to.be.true;

    await Fs.remove(Fs.join(root, 'alpha'));
    const removed = await WorkspaceCi.Test.Linux.sync({ cwd: fs.dir, source: { root }, target });
    expect(removed.kind).to.eql('removed');
    expect(await Fs.exists(fs.join(target))).to.be.false;

    const skipped = await WorkspaceCi.Test.Linux.sync({ cwd: fs.dir, source: { root }, target });
    expect(skipped.kind).to.eql('skipped');
  });

  it('filters explicit path sources by test task presence', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.sync.paths');
    const testDir = fs.join('code/projects/testable');
    const buildDir = fs.join('code/projects/build-only');

    await Fs.writeJson(Fs.join(testDir, 'deno.json'), { tasks: { test: 'deno task info' } });
    await Fs.writeJson(Fs.join(buildDir, 'deno.json'), { tasks: { build: 'deno task info' } });

    const written = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths: [buildDir, testDir] },
      target: '.github/workflows/test.yaml',
    });

    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw new Error('expected written result');
    expect(written.count).to.eql(1);
    expect(written.yaml.includes(testDir)).to.be.true;
    expect(written.yaml.includes(buildDir)).to.be.false;
  });
});

type WorkflowStep = {
  readonly name?: string;
  readonly uses?: string;
  readonly with?: Readonly<Record<string, string>>;
  readonly run?: string;
};

type WorkflowJob = {
  readonly 'runs-on': string;
  readonly permissions: Readonly<Record<string, string>>;
  readonly environment?: unknown;
  readonly env?: unknown;
  readonly strategy?: unknown;
  readonly needs?: string;
  readonly steps: readonly WorkflowStep[];
};

type WorkflowDoc = {
  readonly jobs: {
    readonly graph: WorkflowJob;
    readonly deno: WorkflowJob;
  };
};
