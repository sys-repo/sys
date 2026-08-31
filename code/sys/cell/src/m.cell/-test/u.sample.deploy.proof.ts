import { Fs, Is, Json, Obj, Testing, Yaml } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { CellPaths } from '../u/paths.ts';

const EXPECTED = {
  descriptor: {
    name: 'sample:deploy',
    services: ['deploy:view'],
    tasks: ['deploy:stage', 'sample:deploy'],
    stage: {
      name: 'deploy:stage',
      use: 'DeployStageTask',
      from: './-scripts/deploy.ts',
      config: './-config/@sys.tools.deploy/stage.yaml',
    },
  },
  endpoint: {
    inspectOk: true,
    refs: [],
    document: {
      source: { dir: '.' },
      staging: { dir: './.tmp/staging', clear: true },
      mappings: [{
        mode: 'copy',
        dir: {
          source: 'view/.pulled/ui.components',
          staging: 'ui.components',
        },
      }],
    },
  },
  execution: ['deploy:stage'],
  result: {
    task: 'sample:deploy',
    steps: ['deploy:stage'],
    allOk: true,
    staged: true,
  },
} as const;

type Report = {
  readonly descriptor: {
    readonly name: string | undefined;
    readonly services: readonly string[];
    readonly tasks: readonly string[];
    readonly stage: {
      readonly name: string;
      readonly use: string;
      readonly from: string;
      readonly config: string;
    };
  };
  readonly endpoint: {
    readonly inspectOk: boolean;
    readonly refs: readonly unknown[];
    readonly document: unknown;
  };
  readonly execution: readonly string[];
  readonly result: {
    readonly task: string;
    readonly steps: readonly string[];
    readonly allOk: boolean;
    readonly staged: boolean;
  };
};

/** Actual Cell deploy-sample proof shared by owner and restricted-authority runners. */
export const DeploySampleProof = Object.freeze({
  async run(): Promise<Report> {
    const sampleUrl = new URL('../../../-sample/cell.deploy', import.meta.url);
    const sampleRoot = Fs.Path.fromFileUrl(sampleUrl);
    const sample = await Cell.load(sampleRoot);
    const stagePlan = await Cell.Task.plan(sample, 'deploy:stage');
    const stage = stagePlan.tree;
    if (stage.kind !== 'leaf') {
      throw new Error('Expected the Deploy sample stage task to declare an endpoint.');
    }
    const task = stage.task;
    const configPath = task.config;
    if (!Is.str(configPath)) {
      throw new Error('Expected the Deploy sample stage task to declare a config.');
    }

    const descriptor = await readRequiredText(sample.paths.descriptor);
    const config = await readRequiredText(Fs.join(sample.root, configPath));
    const adapter = await readRequiredText(Fs.join(sample.root, task.from));
    const ast = Yaml.parseAst(config);
    const inspected = Yaml.EnvRef.inspectAst(ast);
    const parsed = Yaml.toJS(ast);

    const fixture = await Testing.dir('cell.sample.deploy.stage');
    await Fs.write(Fs.join(fixture.dir, CellPaths.descriptor), descriptor, { force: true });
    await Fs.write(Fs.join(fixture.dir, configPath), config, { force: true });
    await Fs.write(Fs.join(fixture.dir, task.from), adapter, { force: true });
    await Fs.write(
      Fs.join(fixture.dir, 'view/.pulled/ui.components/index.html'),
      '<!doctype html><html><body>ui</body></html>\n',
      { force: true },
    );

    const execution: string[] = [];
    const result = await Cell.Task.run(await Cell.load(fixture.dir), 'sample:deploy', {
      onEvent(event) {
        if (event.kind === 'task:step:start') execution.push(event.step.name);
      },
    });

    return {
      descriptor: {
        name: sample.descriptor.name,
        services: sample.descriptor.services?.map((service) => service.name) ?? [],
        tasks: sample.descriptor.tasks?.map((task) => task.name) ?? [],
        stage: {
          name: task.name,
          use: task.use,
          from: task.from,
          config: configPath,
        },
      },
      endpoint: {
        inspectOk: inspected.ok,
        refs: inspected.refs,
        document: parsed.ok ? parsed.data : parsed.errors,
      },
      execution,
      result: {
        task: result.task.name,
        steps: result.steps.map((step) => step.task.name),
        allOk: result.steps.every((step) => step.ok),
        staged: await Fs.exists(Fs.join(fixture.dir, '.tmp/staging/ui.components/index.html')),
      },
    };
  },

  assert(report: Report): void {
    if (!Obj.eql(report, EXPECTED)) {
      const actual = Json.stringify(report);
      const expected = Json.stringify(EXPECTED);
      throw new Error(`Cell Deploy sample proof failed.\nactual: ${actual}\nexpected: ${expected}`);
    }
  },
});

async function readRequiredText(path: string): Promise<string> {
  const result = await Fs.readText(path);
  if (!result.ok) throw result.error;
  return result.data ?? '';
}
