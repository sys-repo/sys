import { Fs, Is, Json, Obj, Path, Testing, Yaml } from '../../-test.ts';
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
      staging: { dir: './.tmp/staging' },
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
    stage: {
      returnedRoot: true,
      frozenEvidence: true,
      exactRoot: true,
      files: ['dist.json', 'index.html', 'ui.components/index.html'],
    },
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
    readonly stage: {
      readonly returnedRoot: boolean;
      readonly frozenEvidence: boolean;
      readonly exactRoot: boolean;
      readonly files: readonly string[];
    };
  };
};

type StageResult = {
  readonly ok: true;
  readonly stagingRoot: string;
  readonly verification: {
    readonly integrity: string;
    readonly dist: {
      readonly hash: {
        readonly digest: string;
        readonly parts: Readonly<Record<string, string>>;
      };
    };
    readonly assets: { readonly files: number };
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
    const fixtureRoot = await Fs.realPath(fixture.dir);
    await Fs.write(Fs.join(fixtureRoot, CellPaths.descriptor), descriptor, { force: true });
    await Fs.write(Fs.join(fixtureRoot, configPath), config, { force: true });
    await Fs.write(Fs.join(fixtureRoot, task.from), adapter, { force: true });
    await Fs.write(
      Fs.join(fixtureRoot, 'view/.pulled/ui.components/index.html'),
      '<!doctype html><html><body>ui</body></html>\n',
      { force: true },
    );

    const execution: string[] = [];
    const result = await Cell.Task.run(await Cell.load(fixtureRoot), 'sample:deploy', {
      onEvent(event) {
        if (event.kind === 'task:step:start') execution.push(event.step.name);
      },
    });
    const staged = stageResultOf(result.steps[0]?.result);
    const stagingRoot = Fs.join(fixtureRoot, '.tmp/staging');
    const files = await regularFiles(stagingRoot);
    const declared = Object.keys(staged.verification.dist.hash.parts).toSorted();
    const exactFiles = [...declared, 'dist.json'].toSorted();

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
        stage: {
          returnedRoot: staged.stagingRoot === stagingRoot,
          frozenEvidence: isFrozenStageEvidence(staged, declared.length),
          exactRoot: Obj.eql(files, exactFiles),
          files,
        },
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

function stageResultOf(input: unknown): StageResult {
  if (!Is.object(input)) throw invalidStageResult();
  const result = input as Record<string, unknown>;
  const verification = result.verification;
  if (result.ok !== true || !Is.str(result.stagingRoot) || !Is.object(verification)) {
    throw invalidStageResult();
  }

  const evidence = verification as Record<string, unknown>;
  const dist = evidence.dist;
  const assets = evidence.assets;
  if (!Is.str(evidence.integrity) || !Is.object(dist) || !Is.object(assets)) {
    throw invalidStageResult();
  }

  const hash = (dist as Record<string, unknown>).hash;
  if (!Is.object(hash) || !Is.num((assets as Record<string, unknown>).files)) {
    throw invalidStageResult();
  }
  const hashRecord = hash as Record<string, unknown>;
  if (!Is.str(hashRecord.digest) || !Is.record(hashRecord.parts)) {
    throw invalidStageResult();
  }
  if (!Object.values(hashRecord.parts).every((value) => Is.str(value))) {
    throw invalidStageResult();
  }
  return input as StageResult;
}

function isFrozenStageEvidence(stage: StageResult, declaredFiles: number): boolean {
  return (
    Object.isFrozen(stage) &&
    Object.isFrozen(stage.verification) &&
    Object.isFrozen(stage.verification.dist) &&
    Object.isFrozen(stage.verification.dist.hash.parts) &&
    stage.verification.integrity !== stage.verification.dist.hash.digest &&
    stage.verification.assets.files === declaredFiles
  );
}

async function regularFiles(root: string): Promise<readonly string[]> {
  const entries = await Fs.glob(root, { includeDirs: false }).find('**/*');
  const files = entries.map((entry) => {
    const relative = Path.relative(root, entry.path);
    if (Path.Is.absolute(relative) || !Path.Is.within(root, entry.path)) {
      throw new Error(`Cell Deploy sample file escaped its staging root: ${entry.path}`);
    }
    return Path.relativePosix(relative);
  });
  return files.toSorted();
}

function invalidStageResult(): Error {
  return new Error('Cell Deploy sample task did not return strict staging evidence.');
}

async function readRequiredText(path: string): Promise<string> {
  const result = await Fs.readText(path);
  if (!result.ok) throw result.error;
  return result.data ?? '';
}
