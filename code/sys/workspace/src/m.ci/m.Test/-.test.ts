import { Yaml } from '@sys/yaml';
import {
  describe,
  Err,
  expect,
  expectError,
  Fs,
  Is,
  it,
  Process,
  Str,
  Testing,
} from '../../-test.ts';
import { WorkspaceCi } from '../mod.ts';
import { CI_DENO_VERSION } from '../u.deno.ts';

type WorkflowStep = {
  readonly name?: string;
  readonly uses?: string;
  readonly with?: Readonly<Record<string, string>>;
  readonly run?: string;
  readonly if?: string;
  readonly 'continue-on-error'?: boolean | string;
};

type WorkflowJob = {
  readonly 'runs-on': string;
  readonly permissions: Readonly<Record<string, string>>;
  readonly environment?: unknown;
  readonly env?: unknown;
  readonly strategy?: {
    readonly matrix: {
      readonly include: readonly {
        readonly name: string;
        readonly path: string;
        readonly browser?: boolean;
        readonly proofs?: boolean;
        readonly cache?: boolean;
      }[];
    };
  };
  readonly needs?: string;
  readonly steps: readonly WorkflowStep[];
};

type WorkflowDoc = {
  readonly jobs: {
    readonly graph: WorkflowJob;
    readonly deno: WorkflowJob;
  };
};

describe('WorkspaceCi.Test.Linux', () => {
  it('declared cache tasks → warm before every test lane and survive regeneration', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.cache');
    const cases = [
      { name: 'ordinary', task: undefined, cache: undefined },
      { name: 'empty', task: '', cache: undefined },
      { name: 'whitespace', task: '  ', cache: undefined },
      { name: 'non-string', task: 1, cache: undefined },
      { name: 'cached', task: 'deno task check', cache: true },
      { name: 'cached-other', task: 'deno task info', cache: true },
    ];
    const paths = cases.map(({ name }) => fs.join('code', name));
    for (const item of cases) {
      const tasks: Record<string, string | number> = {
        test: 'deno task info',
        'test:proofs': 'deno task info',
        'test:browser': 'deno task info',
      };
      if (!Is.nil(item.task)) tasks['test:cache'] = item.task;
      await Fs.writeJson(fs.join('code', item.name, 'deno.json'), {
        name: `@scope/${item.name}`,
        tasks,
        'x-sys': { ci: { test: { browser: true } } },
      });
    }

    const yaml = await WorkspaceCi.Test.Linux.text({ paths });
    const doc = workflow(yaml);
    expect(doc.jobs.deno.strategy?.matrix.include).to.eql(
      cases.map(({ name, cache }) => ({
        name: `@scope/${name}`,
        path: fs.join('code', name),
        browser: true,
        proofs: true,
        ...(cache ? { cache: true } : {}),
      })),
    );
    const steps = doc.jobs.deno.steps;
    const cache = steps.filter((step) => step.run?.includes('deno task test:cache'));
    expect(cache).to.have.length(1);
    expect(cache[0]?.if).to.eql('${{ matrix.cache == true }}');
    expect(cache[0]?.run?.trim()).to.eql(Str.dedent(`
      cd \${{ matrix.path }}
      deno task test:cache
    `));
    expect(cache[0]?.['continue-on-error'] ?? false).to.eql(false);
    const step = cache[0];
    if (!step) throw Err.std('Missing cache step');
    const install = steps.findIndex((step) => step.run?.includes('if deno task install; then'));
    expect(install >= 0 && install < steps.indexOf(step), 'install precedes cache preparation').to
      .eql(true);
    for (const name of ['test', 'test:proofs', 'test:browser']) {
      const test = steps.findIndex((step) => step.run?.trim().endsWith(`deno task ${name}`));
      expect(test > steps.indexOf(step), name).to.eql(true);
    }

    const target = '.github/workflows/test.yaml';
    await Fs.write(fs.join(target), 'stale workflow');
    const first = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths },
      target,
    });
    expect(first.kind).to.eql('written');
    expect((await Fs.readText(fs.join(target))).data).to.eql(yaml);
    const second = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths },
      target,
    });
    expect(second.kind).to.eql('unchanged');

    const scopedPaths = [fs.join('code', 'ordinary'), fs.join('code', 'cached-other')];
    const scopedTarget = '.github/workflows/test.scoped.yaml';
    const scoped = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths: scopedPaths },
      target: scopedTarget,
    });
    expect(scoped.kind).to.eql('written');
    if (scoped.kind !== 'written') throw Err.std('Expected scoped workflow');
    expect(scoped.count).to.eql(2);
    expect(workflow(scoped.yaml).jobs.deno.strategy?.matrix.include).to.eql(
      doc.jobs.deno.strategy?.matrix.include.filter((row) => scopedPaths.includes(row.path)),
    );
    expect((await Fs.readText(fs.join(scopedTarget))).data).to.eql(scoped.yaml);
    const scopedAgain = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths: scopedPaths },
      target: scopedTarget,
    });
    expect(scopedAgain.kind).to.eql('unchanged');
  });

  it('declared proof tasks → selected independently of browser tasks and routed fail-fast', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.proofs');
    const cases = [
      { name: 'ordinary', task: undefined, browser: false, proofs: undefined },
      { name: 'empty', task: '', browser: false, proofs: undefined },
      { name: 'non-string', task: 1, browser: false, proofs: undefined },
      { name: 'proofs', task: 'deno task info', browser: false, proofs: true },
      { name: 'browser', task: undefined, browser: true, proofs: undefined },
      { name: 'both', task: 'deno task info', browser: true, proofs: true },
    ];
    const paths = cases.map(({ name }) => fs.join('code', name));
    for (const item of cases) {
      const tasks: Record<string, string | number> = { test: 'deno task info' };
      if (!Is.nil(item.task)) tasks['test:proofs'] = item.task;
      if (item.browser) tasks['test:browser'] = 'deno task info';
      await Fs.writeJson(fs.join('code', item.name, 'deno.json'), {
        name: `@scope/${item.name}`,
        tasks,
        'x-sys': { ci: { test: { browser: item.browser } } },
      });
    }

    const doc = workflow(await WorkspaceCi.Test.Linux.text({ paths }));
    expect(doc.jobs.deno.strategy?.matrix.include).to.eql(
      cases.map(({ name, browser, proofs }) => ({
        name: `@scope/${name}`,
        path: fs.join('code', name),
        ...(browser ? { browser: true } : {}),
        ...(proofs ? { proofs: true } : {}),
      })),
    );
    const steps = doc.jobs.deno.steps;
    const proof = proofStep(doc);
    expect(proof.if, 'proofs must run only for selected matrix members').to.eql(
      '${{ matrix.proofs == true }}',
    );
    expect(proof['continue-on-error'] ?? false, 'proof failure must fail the job').to.eql(false);
    const base = steps.findIndex((step) => step.name === 'test module → "${{ matrix.name }}"');
    const browser = steps.findIndex((step) =>
      step.name === 'browser test module → "${{ matrix.name }}"'
    );
    expect(base >= 0 && base < steps.indexOf(proof) && steps.indexOf(proof) < browser).to.eql(true);
    expect(steps[browser]?.if).to.eql('${{ matrix.browser == true }}');
  });
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
    expect(graph['runs-on']).to.eql('ubuntu-24.04');
    expect(deno['runs-on']).to.eql('ubuntu-24.04');
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

  it('rendered Chrome path guard → accepts spaces and rejects unsafe delimiters', async () => {
    const yaml = await WorkspaceCi.Test.Linux.text({ paths: [] });
    const parsed = Yaml.parse<WorkflowDoc>(yaml);
    expect(parsed.error).to.eql(undefined);
    const step = parsed.data?.jobs.deno.steps.find((step) =>
      step.name === 'Configure Browser Runtime: Chrome'
    );
    // Execute the emitted guard, without depending on an installed browser.
    const guard = step?.run?.match(/case "\$path" in[\s\S]*?esac/)?.[0];
    if (!guard) throw Err.std('Expected rendered browser path guard');
    const script = Str.dedent(`
      path="$1"
      ${guard}
    `);

    const cases = [
      { label: 'plain path', path: '/opt/chrome', exitCode: 0 },
      { label: 'spaces', path: '/opt/Google Chrome/chrome', exitCode: 0 },
      { label: 'comma', path: '/opt/chrome,stable', exitCode: 1 },
      { label: 'carriage return', path: '/opt/chrome\rstable', exitCode: 1 },
      { label: 'line feed', path: '/opt/chrome\nstable', exitCode: 1 },
    ];
    for (const { label, path, exitCode } of cases) {
      const result = await Process.invoke({
        cmd: 'bash',
        args: ['-c', script, 'browser-path-guard', path],
        clearEnv: true,
        silent: true,
      });
      expect(result.code, label).to.eql(exitCode);
      expect(result.text.stderr, label).to.eql('');
      if (exitCode === 0) expect(result.text.stdout, label).to.eql('');
      else expect(result.text.stdout, label).to.include('Chrome executable path is unsafe');
    }
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

  it('stale output → repaired proof wiring → unchanged second sync', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.sync.unchanged');
    const moduleDir = fs.join('code/sys/alpha');
    const target = '.github/workflows/test.yaml';

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task info' },
    });

    // Seed an ordinary workflow, then select proofs as a package-owned task.
    const stale = await WorkspaceCi.Test.Linux.text({ cwd: fs.dir, paths: [moduleDir] });
    await Fs.write(fs.join(target), stale);
    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task info', 'test:proofs': 'deno task info' },
    });
    const first = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(first.kind).to.eql('written');
    const repaired = (await Fs.readText(fs.join(target))).data ?? '';
    const doc = workflow(repaired);
    expect(doc.jobs.deno.strategy?.matrix.include).to.eql([
      { name: '@scope/alpha', path: moduleDir, proofs: true },
    ]);
    expect(proofStep(doc).if).to.eql('${{ matrix.proofs == true }}');

    const second = await WorkspaceCi.Test.Linux.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(second.kind).to.eql('unchanged');
    expect(second.target).to.eql(fs.join(target));
    expect(second.count).to.eql(1);
    expect((await Fs.readText(fs.join(target))).data).to.eql(repaired);
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

/** Parse only the workflow shape exercised by this suite. */
function workflow(yaml: string): WorkflowDoc {
  const parsed = Yaml.parse<WorkflowDoc>(yaml);
  expect(parsed.error).to.eql(undefined);
  if (!parsed.data) throw Err.std('Expected parsed Linux workflow');
  return parsed.data;
}

function proofStep(doc: WorkflowDoc): WorkflowStep {
  const selected = doc.jobs.deno.steps.filter((step) =>
    step.run?.includes('deno task test:proofs')
  );
  expect(selected, 'expected exactly one proof step').to.have.length(1);
  const step = selected[0];
  if (!step) throw Err.std('Missing proof step');
  expect(step.run?.trim(), 'proof command must use the matrix cwd and propagate failure').to.eql(
    Str.dedent(`
      cd \${{ matrix.path }}
      deno task test:proofs
    `),
  );
  return step;
}
