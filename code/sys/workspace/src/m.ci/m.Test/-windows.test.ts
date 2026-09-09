import { Yaml } from '@sys/yaml';
import {
  describe,
  Err,
  expect,
  expectError,
  expectTypeOf,
  Fs,
  it,
  type t,
  Testing,
} from '../../-test.ts';
import { WorkspaceCi } from '../mod.ts';
import { CI_DENO_VERSION } from '../u.deno.ts';

describe('WorkspaceCi.Test.Windows', () => {
  it('keeps workflow environment input out of the Windows type plane', () => {
    expectTypeOf(undefined as Extract<'env', keyof t.WorkspaceCi.Test.Windows.Args>)
      .toEqualTypeOf<never>();
    expectTypeOf(undefined as Extract<'env', keyof t.WorkspaceCi.Test.Windows.SyncArgs>)
      .toEqualTypeOf<never>();
  });

  it('renders the native Windows workflow contract from ordered module paths', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.text');
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { 'test:windows': 'deno task test' },
    });
    await Fs.writeJson(Fs.join(b, 'deno.json'), {
      name: '@scope/beta',
      tasks: { test: 'deno task info', 'test:windows': 'deno task test' },
      'x-sys': { ci: { test: { browser: true } } },
    });

    const yaml = await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [a, b] });
    const parsed = Yaml.parse<WorkflowDoc>(yaml);
    expect(parsed.error).to.eql(undefined);
    const doc = parsed.data;
    if (!doc) throw Err.std('Expected parsed Windows workflow');

    expect(doc.name).to.eql('test:windows');
    const job = doc.jobs.deno;
    expect(job['runs-on']).to.eql('windows-2025');
    expect(job.permissions).to.eql({ contents: 'read' });
    expect(job.environment).to.eql(undefined);
    expect(job.defaults).to.eql({ run: { shell: 'pwsh' } });
    expect(job.name).to.eql('${{ matrix.name }}');
    expect(job.strategy['fail-fast']).to.eql(false);
    expect(job.strategy.matrix.include).to.eql([
      { name: '@scope/alpha', path: 'code/sys/alpha' },
      { name: '@scope/beta', path: 'code/sys/beta' },
    ]);
    expect(yaml.includes('path: "code/sys/alpha"')).to.eql(true);
    expect(yaml.includes(a)).to.eql(false);
    expect(yaml.includes(b)).to.eql(false);

    const steps = job.steps;
    expect(steps[0]).to.eql({ uses: 'actions/checkout@v5' });
    expect(steps[1]).to.eql({
      name: 'Install ESM Runtime: Deno 2.x',
      uses: 'denoland/setup-deno@v2',
      with: { 'deno-version': CI_DENO_VERSION },
    });
    expect(findStep(steps, 'Install Dependencies')?.run).to.eql('deno task install');
    expect(findStep(steps, 'Workspace Info')?.run).to.eql('deno task info');
    expect(findStep(steps, 'Verify workspace graph')?.run).to.eql('deno task check:graph');
    expect(findStep(steps, 'Deno Info')?.run).to.eql('deno info && deno --version');

    const test = findStep(steps, 'test:windows module → "${{ matrix.name }}"');
    expect(test?.run).to.eql('deno task test:windows');
    expect(test?.['working-directory']).to.eql('${{ matrix.path }}');
    expect(steps.filter((step) => step['working-directory'] !== undefined).length).to.eql(1);
    expect(steps.filter((step) => step.shell !== undefined).length).to.eql(0);

    const forbidden = [
      'ubuntu',
      'shell: bash',
      'seq ',
      '$((',
      'test -z',
      'command -v',
      '$GITHUB_ENV',
      '\n          cd ',
      'Configure Browser Runtime: Chrome',
      'test:browser',
      'deno publish',
      'id-token:',
      'environment:',
    ];
    for (const value of forbidden) expect(yaml.includes(value)).to.eql(false);
  });

  it('sync admits only test:windows tasks and preserves explicit source order', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.sync.paths');
    const first = fs.join('code/projects/first');
    const ordinary = fs.join('code/projects/ordinary-only');
    const second = fs.join('code/projects/second');
    const target = '.github/workflows/test.windows.yaml';

    await Fs.writeJson(Fs.join(first, 'deno.json'), {
      name: '@scope/first',
      tasks: { 'test:windows': 'deno task test' },
    });
    await Fs.writeJson(Fs.join(ordinary, 'deno.json'), {
      name: '@scope/ordinary-only',
      tasks: { test: 'deno task info' },
    });
    await Fs.writeJson(Fs.join(second, 'deno.json'), {
      name: '@scope/second',
      tasks: { 'test:windows': 'deno task test' },
    });

    const written = await WorkspaceCi.Test.Windows.sync({
      cwd: fs.dir,
      source: { paths: [second, ordinary, first] },
      target,
    });
    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw Err.std('Expected written Windows workflow');
    expect(written.count).to.eql(2);
    expect(written.yaml.includes('@scope/ordinary-only')).to.eql(false);
    expect(written.yaml.indexOf('@scope/second') < written.yaml.indexOf('@scope/first')).to.eql(
      true,
    );

    const unchanged = await WorkspaceCi.Test.Windows.sync({
      cwd: fs.dir,
      source: { paths: [second, ordinary, first] },
      target,
    });
    expect(unchanged.kind).to.eql('unchanged');
    expect(unchanged.count).to.eql(2);
  });

  it('text and write enforce exact nonempty test:windows admission', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.admission');
    const fixtures = [
      { name: '@scope/absent', path: 'code/sys/absent', tasks: { test: 'deno task test' } },
      { name: '@scope/empty', path: 'code/sys/empty', tasks: { 'test:windows': '' } },
      { name: '@scope/blank', path: 'code/sys/blank', tasks: { 'test:windows': '   ' } },
      {
        name: '@scope/non-string',
        path: 'code/sys/non-string',
        tasks: { 'test:windows': true },
      },
    ] as const;

    for (const fixture of fixtures) {
      await Fs.writeJson(fs.join(fixture.path, 'deno.json'), {
        name: fixture.name,
        tasks: fixture.tasks,
      });
      await expectError(
        async () => await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [fixture.path] }),
        'missing nonempty task "test:windows"',
      );
    }

    const target = '.github/workflows/test.windows.yaml';
    await expectError(
      async () =>
        await WorkspaceCi.Test.Windows.write({
          cwd: fs.dir,
          paths: [fixtures[0].path],
          target,
        }),
      'missing nonempty task "test:windows"',
    );
    expect(await Fs.exists(fs.join(target))).to.eql(false);
  });

  it('normalizes in-repository paths and rejects lexical and physical escapes', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.paths');
    const inside = fs.join('code/sys/inside');
    await Fs.writeJson(Fs.join(inside, 'deno.json'), {
      name: '@scope/inside',
      tasks: { 'test:windows': 'deno task test' },
    });

    const yaml = await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [inside] });
    const parsed = Yaml.parse<WorkflowDoc>(yaml);
    expect(parsed.error).to.eql(undefined);
    expect(parsed.data?.jobs.deno.strategy.matrix.include).to.eql([
      { name: '@scope/inside', path: 'code/sys/inside' },
    ]);

    const insideAlias = fs.join('code/sys/inside-alias');
    await Deno.symlink(inside, insideAlias, { type: 'dir' });
    const aliasYaml = await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [insideAlias] });
    const aliasParsed = Yaml.parse<WorkflowDoc>(aliasYaml);
    expect(aliasParsed.error).to.eql(undefined);
    expect(aliasParsed.data?.jobs.deno.strategy.matrix.include).to.eql([
      { name: '@scope/inside', path: 'code/sys/inside-alias' },
    ]);

    const outside = await Testing.dir('WorkspaceCi.Test.Windows.paths.outside');
    const outsideModule = outside.join('code/sys/outside');
    await Fs.writeJson(Fs.join(outsideModule, 'deno.json'), {
      name: '@scope/outside',
      tasks: { 'test:windows': 'deno task test' },
    });
    await expectError(
      async () => await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [outsideModule] }),
      'outside cwd',
    );

    const outsideAlias = fs.join('code/sys/outside-alias');
    await Deno.symlink(outsideModule, outsideAlias, { type: 'dir' });
    await expectError(
      async () => await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [outsideAlias] }),
      'outside cwd',
    );

    const manifestAlias = fs.join('code/sys/manifest-alias');
    await Fs.ensureDir(manifestAlias);
    await Deno.symlink(
      Fs.join(outsideModule, 'deno.json'),
      Fs.join(manifestAlias, 'deno.json'),
      { type: 'file' },
    );
    await expectError(
      async () => await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [manifestAlias] }),
      'outside cwd',
    );
  });

  it('does not expose legacy workflow environment input on Windows', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.env');
    const moduleDir = fs.join('code/sys/alpha');
    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { 'test:windows': 'deno task test' },
    });

    const args = {
      cwd: fs.dir,
      paths: [moduleDir],
      env: {
        SAFE: 'ok\n      TOKEN: ${{ secrets.RELEASE }}\n    environment: production',
      },
    };
    const yaml = await WorkspaceCi.Test.Windows.text(args);
    const parsed = Yaml.parse<WorkflowDoc>(yaml);
    expect(parsed.error).to.eql(undefined);
    expect(parsed.data?.jobs.deno.env).to.eql(undefined);
    expect(parsed.data?.jobs.deno.environment).to.eql(undefined);
    expect(yaml.includes('${{ secrets.RELEASE }}')).to.eql(false);
  });

  it('fails closed on trigger injection and preserves trigger scalar meaning', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.triggers');
    const moduleDir = fs.join('code/sys/alpha');
    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { 'test:windows': 'deno task test' },
    });

    const injection = 'main\n  pull_request_target:\nenv:\n  TOKEN: ${{ secrets.RELEASE }}';
    await expectError(
      async () =>
        await WorkspaceCi.Test.Windows.text({
          cwd: fs.dir,
          paths: [moduleDir],
          on: { push: { branches: [injection] } },
        }),
      'Invalid workflow trigger value',
    );
    await expectError(
      async () =>
        await WorkspaceCi.Test.Windows.text({
          cwd: fs.dir,
          paths: [moduleDir],
          on: { push: { branches: ['${{ secrets.RELEASE }}'] } },
        }),
      'Invalid workflow trigger value',
    );

    for (const value of ['', '   ', 42] as const) {
      await expectError(
        async () =>
          await WorkspaceCi.Test.Windows.text({
            cwd: fs.dir,
            paths: [moduleDir],
            on: {
              push: { branches: [value] },
            } as unknown as t.WorkspaceCi.WorkflowOn,
          }),
        'Invalid workflow trigger value',
      );
    }

    const branches = [
      'feature/*',
      'release:beta',
      'docs/#draft',
      'true',
      'null',
      'y',
      'n',
      '123',
      '2026-08-24',
      '.nan',
      '~',
      '...',
      '*alias',
      '!tag',
    ];
    const yaml = await WorkspaceCi.Test.Windows.text({
      cwd: fs.dir,
      paths: [moduleDir],
      on: {
        push: { branches, tags: ['v*'], paths_ignore: ['docs/#draft'] },
        pull_request: { branches: ['false'], paths_ignore: ['!generated/**'] },
        workflow_dispatch: true,
      },
    });
    const parsed = Yaml.parse<WorkflowDoc>(yaml);
    expect(parsed.error).to.eql(undefined);
    expect(parsed.data?.on.push?.branches).to.eql(branches);
    expect(parsed.data?.on.push?.tags).to.eql(['v*']);
    expect(parsed.data?.on.push?.['paths-ignore']).to.eql(['docs/#draft']);
    expect(parsed.data?.on.pull_request?.branches).to.eql(['false']);
    expect(parsed.data?.on.pull_request?.['paths-ignore']).to.eql(['!generated/**']);
    expect(parsed.data?.on.workflow_dispatch).to.eql(null);
    expect(parsed.data?.env).to.eql(undefined);
    expect(parsed.data?.pull_request_target).to.eql(undefined);
    expect(yaml.includes('${{ secrets.RELEASE }}')).to.eql(false);
  });

  it('fails closed before rendering unsafe matrix values', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.safe');
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha";echo',
      tasks: { 'test:windows': 'deno task test' },
    });

    await expectError(
      async () => await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [moduleDir] }),
      'Unsafe workflow matrix name',
    );

    const unsafePath = fs.join('code/sys/bad;echo');
    await Fs.writeJson(Fs.join(unsafePath, 'deno.json'), {
      name: '@scope/safe',
      tasks: { 'test:windows': 'deno task test' },
    });
    await expectError(
      async () => await WorkspaceCi.Test.Windows.text({ cwd: fs.dir, paths: [unsafePath] }),
      'Unsafe workflow matrix path',
    );
  });

  it('removes a stale workflow when no admitted module remains', async () => {
    const fs = await Testing.dir('WorkspaceCi.Test.Windows.sync.remove');
    const root = fs.join('code/projects');
    const target = '.github/workflows/test.windows.yaml';

    await Fs.writeJson(Fs.join(root, 'ordinary/deno.json'), {
      tasks: { test: 'deno task info' },
    });
    await Fs.write(fs.join(target), 'stale');

    const removed = await WorkspaceCi.Test.Windows.sync({ cwd: fs.dir, source: { root }, target });
    expect(removed).to.eql({ kind: 'removed', target, count: 0 });
    expect(await Fs.exists(fs.join(target))).to.eql(false);

    const skipped = await WorkspaceCi.Test.Windows.sync({ cwd: fs.dir, source: { root }, target });
    expect(skipped).to.eql({ kind: 'skipped', target, count: 0 });
  });
});

type WorkflowStep = {
  readonly name?: string;
  readonly uses?: string;
  readonly with?: Readonly<Record<string, string>>;
  readonly shell?: string;
  readonly run?: string;
  readonly 'working-directory'?: string;
};

type WorkflowDoc = {
  readonly name: string;
  readonly on: {
    readonly push?: {
      readonly branches?: readonly string[];
      readonly tags?: readonly string[];
      readonly 'paths-ignore'?: readonly string[];
    };
    readonly pull_request?: {
      readonly branches?: readonly string[];
      readonly 'paths-ignore'?: readonly string[];
    };
    readonly workflow_dispatch?: null;
  };
  readonly env?: unknown;
  readonly pull_request_target?: unknown;
  readonly jobs: {
    readonly deno: {
      readonly 'runs-on': string;
      readonly permissions: Readonly<Record<string, string>>;
      readonly environment?: unknown;
      readonly env?: unknown;
      readonly defaults: { readonly run: { readonly shell: string } };
      readonly name: string;
      readonly strategy: {
        readonly 'fail-fast': boolean;
        readonly matrix: {
          readonly include: readonly { readonly name: string; readonly path: string }[];
        };
      };
      readonly steps: readonly WorkflowStep[];
    };
  };
};

function findStep(steps: readonly WorkflowStep[], name: string) {
  return steps.find((step) => step.name === name);
}
