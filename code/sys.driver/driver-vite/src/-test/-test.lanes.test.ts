import config from '../../deno.json' with { type: 'json' };
import { describe, Err, expect, Fs, it, ROOT, Str, Yaml } from '../-test.ts';

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
    const cache = tasks['test:cache'];
    const args = cache.trim().split(/\s+/);
    expect(args.slice(0, 2), 'Vite owns a type-checked no-run cache task').to.eql(['deno', 'test']);
    for (
      const flag of ['--no-run', '--node-modules-dir=auto', '-P=test', '--frozen', '--no-prompt']
    ) {
      expect(args).to.include(flag);
    }
    expect(cache).not.to.include('--cached-only');
    expect(cache).not.to.include('--no-check');
    expect(paths(cache)).to.include('./src');
    const selected = proofLanes(tasks['test:proofs']).flatMap((name) => paths(tasks[name]));
    for (const path of selected.filter((path) => !path.endsWith('.test.ts'))) {
      expect(paths(cache), `explicit proof entry must be warmed: ${path}`).to.include(path);
    }
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
    proofLanes(tasks['test:proofs']);
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
    const selected = proofLanes(tasks['test:proofs']).flatMap((name) => paths(tasks[name]));
    assertPartition(tasks['test:unit'], selected);
    for (const path of selected) {
      expect(await Fs.exists(ROOT.resolve('code/sys.driver/driver-vite', path)), path).to.eql(true);
    }
  });

  it('explicit proofs → common invocation without unit exclusions', () => {
    expect(tasks['test:run']).not.to.include('--ignore');
    for (const flag of ['--frozen', '--cached-only', '--no-prompt']) {
      expect(tasks['test:run']).to.include(flag);
    }
    const explicit = ['test:dist:pipeline', 'test:external', 'test:integrity'];
    for (const name of [...proofLanes(tasks['test:proofs']), ...explicit]) {
      const args = tasks[name].trim().split(/\s+/);
      expect(args.slice(0, 3), name).to.eql(['deno', 'task', 'test:run']);
      expect(args, name).not.to.include('test:unit');
      expect(tasks[name], name).not.to.include('--ignore');
    }
  });

  it('aggregate contract → tolerates whitespace/order but rejects lost lanes and non-fail-fast execution', () => {
    const reordered = [...proofTasks].reverse();
    const command = reordered.map((name) => ` deno  task  ${name} `).join('  &&  ');
    expect(proofLanes(command)).to.eql(reordered);
    const missing = proofTasks.filter((name) => name !== 'test:build');
    expect(() => proofLanes(missing.map((name) => `deno task ${name}`).join(' && '))).to.throw(
      'Missing required proof lane: test:build',
    );
    for (const separator of [';', '||', '&']) {
      expect(() => proofLanes(command.replace('&&', separator))).to.throw(
        'Expected fail-fast deno task chain',
      );
    }
    expect(() => proofLanes(`${command} && deno task test:dist:pipeline`)).to.throw(
      'Dist pipeline must remain outside the proof aggregate',
    );
  });

  it('coverage partition → file splits stay valid; excluded-but-unselected files fail', () => {
    const original = ['./src/one.test.ts'];
    assertPartition(`deno task test:run --ignore=${original.join(',')}`, original);
    const split = ['./src/two.test.ts', './src/one.test.ts'];
    const unit = `deno task test:run --ignore=${split.join(',')}`;
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

function proofLanes(command: string): readonly string[] {
  const names = taskNames(command);
  for (const name of proofTasks) {
    if (!names.includes(name)) throw Err.std(`Missing required proof lane: ${name}`);
  }
  if (names.includes('test:dist:pipeline')) {
    throw Err.std('Dist pipeline must remain outside the proof aggregate');
  }
  return names;
}

function assertPartition(unit: string, selected: readonly string[]) {
  const ignored = (unit.match(/(?:^|\s)--ignore=(\S+)/)?.[1] ?? '')
    .split(',').filter((path) => path.length > 0).sort();
  expect(ignored, 'Unit exclusions must match selected proof test files').to.eql(
    selected.filter((path) => path.endsWith('.test.ts')).sort(),
  );
}

function paths(task: string) {
  return task.trim().split(/\s+/).filter((arg) => arg === './src' || arg.startsWith('./src/'));
}
