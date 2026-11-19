import config from '../../deno.json' with { type: 'json' };
import { commands, lanes } from '../../-scripts/task.test.ts';
import { describe, Err, expect, Fs, it, Obj, ROOT, Str, Yaml } from '../-test.ts';

type Workflow = {
  readonly jobs: {
    readonly deno: {
      readonly strategy: {
        readonly matrix: {
          readonly include: readonly {
            readonly path: string;
            readonly proofs?: boolean;
            readonly cache?: boolean;
          }[];
        };
      };
      readonly steps: readonly {
        readonly if?: string;
        readonly run?: string;
        readonly 'continue-on-error'?: boolean | string;
      }[];
    };
  };
};

const tasks: Readonly<Record<string, string>> = config.tasks;
const proofTasks = [
  'test:entry:process',
  'test:candidate',
  'test:build',
  'test:bridge',
  'test:dev',
  'test:config:process',
  'test:graph',
  'test:loader',
  'test:integrity:build',
] as const;

describe('Vite test lanes', () => {
  it('cache preparation → frozen type-check graph and fail-fast CI ordering', async () => {
    const launcher = tasks['test:cache'];
    expect(launcher).to.include('./-scripts/task.test.ts cache');
    expect(launcher).to.include('--frozen');
    expect(launcher).not.to.include('--cached-only');
    const args = commands(['cache'])[0];
    expect(args[0], 'Vite owns a type-checked no-run cache task').to.eql('test');
    for (
      const flag of ['--no-run', '--node-modules-dir=auto', '-P=test', '--frozen', '--no-prompt']
    ) {
      expect(args).to.include(flag);
    }
    expect(args).not.to.include('--cached-only');
    expect(args).not.to.include('--no-check');
    expect(args).to.include('./src');
    expect(args, 'warm the launcher and default-discovered script tests').to.include('./-scripts');
    const selected = commands(['proofs']).flatMap(paths);
    assertCache(args, selected);
    const yaml = (await Fs.readText(ROOT.resolve('.github/workflows/test.linux.yaml'))).data ?? '';
    const job = Yaml.parse<Workflow>(yaml).data?.jobs.deno;
    if (!job) throw Err.std('Missing Linux workflow');
    assertViteCacheSelection(job.strategy.matrix.include);
    const cacheSteps = job.steps.filter((step) => step.run?.includes('deno task test:cache'));
    expect(cacheSteps).to.have.length(1);
    const step = cacheSteps[0];
    if (!step) throw Err.std('Missing cache step');
    expect(step.if).to.eql('${{ matrix.cache == true }}');
    expect(step.run?.trim()).to.eql(Str.dedent(`
      cd \${{ matrix.path }}
      deno task test:cache
    `));
    expect(step['continue-on-error'] ?? false).to.eql(false);
    const install = job.steps.findIndex((item) => item.run?.includes('if deno task install; then'));
    expect(install >= 0 && install < job.steps.indexOf(step), 'install precedes cache preparation')
      .to.eql(true);
    for (const name of ['test', 'test:proofs', 'test:browser']) {
      const test = job.steps.findIndex((item) => item.run?.trim().endsWith(`deno task ${name}`));
      expect(test > job.steps.indexOf(step), name).to.eql(true);
    }
  });

  it('cache selection → other adopters are allowed; missing preparation and duplicate Vite rows fail', () => {
    const vite = {
      name: config.name,
      path: 'code/sys.driver/driver-vite',
      proofs: true,
      cache: true,
    } as const;
    const other = { name: '@scope/other', path: 'code/other', cache: true } as const;
    assertViteCacheSelection([other, vite]);
    expect(() => assertViteCacheSelection([other])).to.throw(
      'Linux CI must select Vite exactly once',
    );
    expect(() => assertViteCacheSelection([vite, other, vite])).to.throw(
      'Linux CI must select Vite exactly once',
    );
    expect(() => assertViteCacheSelection([{ ...vite, cache: false }, other])).to.throw(
      'Linux CI must select Vite cache preparation',
    );
  });

  it('routine CI lane → base only; former runtime coverage stays explicit', async () => {
    expect(taskNames(tasks.test)).to.eql(['test:unit']);
    assertProofs(commands(['proofs']));
    expect(taskNames(tasks.ci), 'module ci must execute the proof aggregate').to.include(
      'test:proofs',
    );
    const yaml = (await Fs.readText(ROOT.resolve('.github/workflows/test.linux.yaml'))).data ?? '';
    const parsed = Yaml.parse<Workflow>(yaml);
    expect(parsed.error, 'Linux workflow must parse').to.eql(undefined);
    if (!parsed.data) throw Err.std('Missing Linux workflow');
    const job = parsed.data.jobs.deno;
    const rows = job.strategy.matrix.include.filter((row) =>
      row.path === 'code/sys.driver/driver-vite'
    );
    expect(rows, 'Linux CI must select Vite exactly once').to.have.length(1);
    expect(rows[0]?.proofs, 'Linux CI must select Vite runtime proofs').to.eql(true);
    const steps = job.steps.filter((step) => step.run?.includes('deno task test:proofs'));
    expect(steps, 'Linux CI must execute the proof aggregate exactly once').to.have.length(1);
    expect(steps[0]?.if, 'Linux CI must route proofs by the task-derived marker').to.eql(
      '${{ matrix.proofs == true }}',
    );
    expect(steps[0]?.run?.trim(), 'Linux CI proofs must use the selected module cwd').to.eql(
      Str.dedent(`
        cd \${{ matrix.path }}
        deno task test:proofs
      `),
    );
    expect(steps[0]?.['continue-on-error'] ?? false, 'Linux CI must propagate proof failure').to
      .eql(false);
  });

  it('unit exclusions → exact files remain selected by proof tasks', async () => {
    const selected = commands(['proofs']).flatMap(paths);
    assertPartition(commands(['unit'])[0], selected);
    for (const path of selected) {
      expect(await Fs.exists(ROOT.resolve('code/sys.driver/driver-vite', path)), path).to.eql(true);
    }
  });

  it('explicit proofs → common invocation without unit exclusions', () => {
    expect(tasks['test:run']).not.to.include('--ignore');
    for (const flag of ['-A', '--frozen', '--cached-only', '--no-prompt']) {
      expect(tasks['test:run']).to.include(flag);
    }
    const explicit = [
      'test:dist:pipeline',
      'test:external',
      'test:integrity:apps',
      'test:integrity',
    ];
    for (const name of [...proofTasks, ...explicit]) {
      const lane = name.slice('test:'.length);
      expect(tasks[name], name).to.eql(`deno task test:lane ${lane}`);
      const args = commands([lane])[0];
      expect(args.slice(0, 3), name).to.eql(['task', 'test:run', '--trace-leaks']);
      expect(args, name).not.to.include('test:unit');
      expect(args.some((arg) => arg.startsWith('--ignore')), name).to.eql(false);
    }
    expect(tasks['test:unit']).to.eql('deno task test:lane unit');
    expect(tasks['test:proofs']).to.eql('deno task test:lane proofs');
    expect(tasks['test:lane']).to.eql(
      'deno run --node-modules-dir=auto -P=test --frozen --cached-only --no-prompt ./-scripts/task.test.ts',
    );
  });

  it('aggregate contract → rejects missing, duplicate, reordered and optional lanes', () => {
    const actual = commands(['proofs']);
    assertProofs(actual);
    for (
      const invalid of [
        actual.slice(1),
        [...actual, actual[0]],
        [...actual].reverse(),
        [...actual, ...commands(['dist:pipeline'])],
      ]
    ) {
      expect(() => assertProofs(invalid)).to.throw();
    }
  });

  it('forwarding → preserve paths, spaces and literal --; aggregate tail reaches final lane only', () => {
    const tail = ['--filter=two words', './a path/test.ts', '--', 'literal $HOME', 'a;b'];
    for (const name of ['unit', 'cache', ...Obj.keys(lanes)]) {
      expect(commands([name, ...tail])).to.eql([[...commands([name])[0], ...tail]]);
    }
    const expected = commands(['proofs']).map((args) => [...args]);
    expected[expected.length - 1].push(...tail);
    expect(commands(['proofs', ...tail])).to.eql(expected);
    for (const input of [[], ['missing'], ['constructor'], ['__proto__']]) {
      expect(() => commands(input)).to.throw('Unknown test lane');
    }
  });

  it('cache preparation → missing non-discovered proof entry is rejected', () => {
    const args = commands(['cache'])[0];
    const selected = commands(['proofs']).flatMap(paths);
    const missing = args.filter((arg) => !arg.endsWith('-loader.npm.proof.ts'));
    expect(() => assertCache(missing, selected)).to.throw();
  });

  it('coverage partition → file splits stay valid; excluded-but-unselected files fail', () => {
    const original = ['./src/one.test.ts'];
    assertPartition([`--ignore=${original.join(',')}`], original);
    const split = ['./src/two.test.ts', './src/one.test.ts'];
    const unit = [`--ignore=${split.join(',')}`];
    assertPartition(unit, [...split].reverse());
    expect(() => assertPartition(unit, ['./src/one.test.ts'])).to.throw(
      'Unit exclusions must match selected proof test files',
    );
  });
});

function assertViteCacheSelection(
  matrix: Workflow['jobs']['deno']['strategy']['matrix']['include'],
) {
  const rows = matrix.filter((row) => row.path === 'code/sys.driver/driver-vite');
  expect(rows, 'Linux CI must select Vite exactly once').to.have.length(1);
  expect(rows[0]?.cache, 'Linux CI must select Vite cache preparation').to.eql(true);
}

/** Only the task-only, fail-fast && form is supported here; this is not a shell parser. */
function taskNames(command: string): readonly string[] {
  return command.split('&&').map((part) => {
    const match = /^deno\s+task\s+([\w:-]+)$/.exec(part.trim());
    if (!match) throw Err.std(`Expected fail-fast deno task chain: ${command}`);
    return match[1];
  });
}

function assertCache(args: readonly string[], selected: readonly string[]) {
  for (const path of selected.filter((path) => !path.endsWith('.test.ts'))) {
    expect(args, `explicit proof entry must be warmed: ${path}`).to.include(path);
  }
}

/** Independent baseline: this is intentionally not derived from the production lane table. */
function assertProofs(actual: readonly (readonly string[])[]) {
  const expected = [
    [
      './src/-entry/-test.external/-graph.process.ts',
      './src/-entry/-test.external/-serve.cached.process.ts',
    ],
    ['./src/m.vite/-test.external/-candidate-consumer.ts'],
    [
      './src/m.vite/-test/-build.test.ts',
      './src/m.vite/-test/-build.workspace-composition.test.ts',
      './src/m.vite/-test/-build.transitive-jsr.test.ts',
      './src/m.vite/-test/-build.failure-causes.test.ts',
      './src/m.vite/-test/-build.startup.test.ts',
      './src/m.vite/-test/-published-fixture-lifecycle.test.ts',
    ],
    [
      './src/m.vite/-test/-bootstrap.handoff.test.ts',
      './src/m.vite/-test/-bridge.integration.test.ts',
    ],
    ['./src/m.vite/-test/-dev.test.ts'],
    [
      './src/m.vite.config/-test/-import-boundary.test.ts',
      './src/m.vite.config/-test/-fromFile.test.ts',
      './src/m.vite.config/-test/-serverFs.test.ts',
    ],
    ['./src/m.vite.plugins/m.OptimizeImports/-test/-u.graph-proof.test.ts'],
    ['./src/m.vite.transport/-test/-loader.npm.proof.ts'],
    ['./src/m.vite.plugins/m.HtmlIntegrity/-test/-html-integrity.build.test.ts'],
  ];
  expect(actual).to.eql(expected.map((files) => ['task', 'test:run', '--trace-leaks', ...files]));
}

function assertPartition(unit: readonly string[], selected: readonly string[]) {
  const ignored = (unit.find((arg) => arg.startsWith('--ignore='))?.slice('--ignore='.length) ?? '')
    .split(',').filter((path) => path.length > 0).sort();
  expect(ignored, 'Unit exclusions must match selected proof test files').to.eql(
    selected.filter((path) => path.endsWith('.test.ts')).sort(),
  );
}

function paths(args: readonly string[]) {
  return args.filter((arg) => arg === './src' || arg.startsWith('./src/'));
}
