import { describe, expect, Fs, it, Str, type t } from '../../../-test.ts';
import { Cell } from '../../mod.ts';
import { tempCell } from '../../-test/u.fixture.ts';

const CELL_ROOT = Fs.resolve('./.tmp/cell.task.plan.unchecked');

describe('Cell.Task.plan', () => {
  it('plans a leaf task without importing its module', async () => {
    resetImports();
    const root = await tempCell(
      'task-plan-leaf-no-import',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeTask(root, './-tasks/capture.ts', mutatingImportTaskSource('CaptureTask'));

    const plan = await Cell.Task.plan(await Cell.load(root), 'capture');

    expect(importEvents()).to.eql([]);
    expect(plan.root).to.eql(root);
    expect(plan.task.name).to.eql('capture');
    expect(plan.tree.kind).to.eql('leaf');
    expect(plan.leaves.length).to.eql(1);
    expect(plan.leaves[0].task.name).to.eql('capture');
    expect(plan.leaves[0].paths.config).to.eql(Fs.join(root, '-config/capture.yaml'));
    expect(plan.leaves[0].endpoint.from).to.eql('./-tasks/capture.ts');
    expect(plan.leaves[0].endpoint.use).to.eql('CaptureTask');
    expect(plan.leaves[0].endpoint.source).to.eql('local');
    expect(plan.leaves[0].endpoint.specifier).to.contain('/-tasks/capture.ts');
  });

  it('plans explicit JSR sys task refs through workspace resolution', async () => {
    const root = await tempCell(
      'task-plan-jsr-sys-ref',
      descriptor([leaf('capture', { use: 'Cell', from: 'jsr:@sys/cell' }, false)]),
    );

    const plan = await Cell.Task.plan(await Cell.load(root), 'capture');

    expect(plan.leaves[0].endpoint.from).to.eql('jsr:@sys/cell');
    expect(plan.leaves[0].endpoint.use).to.eql('Cell');
    expect(plan.leaves[0].endpoint.source).to.eql('trusted');
    expect(plan.leaves[0].endpoint.specifier).to.contain('/code/sys/cell/src/mod.ts');
  });

  it('plans bare sys task refs through workspace resolution', async () => {
    const root = await tempCell(
      'task-plan-bare-sys-ref',
      descriptor([leaf('capture', { use: 'Cell', from: "'@sys/cell'" }, false)]),
    );

    const plan = await Cell.Task.plan(await Cell.load(root), 'capture');

    expect(plan.leaves[0].endpoint.from).to.eql('@sys/cell');
    expect(plan.leaves[0].endpoint.use).to.eql('Cell');
    expect(plan.leaves[0].endpoint.source).to.eql('trusted');
    expect(plan.leaves[0].endpoint.specifier).to.contain('/code/sys/cell/src/mod.ts');
  });

  it('preserves nested composite shape and repeated leaf occurrences', async () => {
    const root = await tempCell(
      'task-plan-composite-shape',
      descriptor([
        leaf('pull:view', { use: 'PullTask', from: './-tasks/pull.ts' }, false),
        leaf('deploy:stage', { use: 'DeployTask', from: './-tasks/deploy.ts' }, false),
        composite('twice', ['pull:view', 'pull:view']),
        composite('all', ['twice', 'deploy:stage']),
      ]),
    );

    const plan = await Cell.Task.plan(await Cell.load(root), 'all');

    expect(plan.tree.kind).to.eql('composite');
    if (plan.tree.kind !== 'composite') throw new Error('expected composite plan');
    expect(plan.tree.task.name).to.eql('all');
    expect(plan.tree.steps.map((step) => step.task.name)).to.eql(['twice', 'deploy:stage']);
    expect(plan.leaves.map((leaf) => leaf.task.name)).to.eql([
      'pull:view',
      'pull:view',
      'deploy:stage',
    ]);
  });

  it('plans only the requested endpoint-address closure', async () => {
    const root = await tempCell(
      'task-plan-requested-closure-only',
      descriptor([
        leaf('capture', { config: './-config/capture.yaml' }),
        leaf('broken:unrelated', { use: 'BrokenTask', from: 'npm:fake-package' }, false),
      ]),
    );

    const plan = await Cell.Task.plan(await Cell.load(root), 'capture');

    expect(plan.leaves.map((leaf) => leaf.task.name)).to.eql(['capture']);
  });

  it('is deterministic for the same loaded Cell/name/options', async () => {
    const root = await tempCell(
      'task-plan-deterministic',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    const cell = await Cell.load(root);

    const a = await Cell.Task.plan(cell, 'capture');
    const b = await Cell.Task.plan(cell, 'capture');

    expect(a).to.eql(b);
  });

  it('does not require local module files to exist', async () => {
    const root = await tempCell(
      'task-plan-missing-module-ok',
      descriptor([leaf('missing', { use: 'MissingTask', from: './-tasks/missing.ts' }, false)]),
    );

    const plan = await Cell.Task.plan(await Cell.load(root), 'missing');

    expect(plan.leaves[0].endpoint.specifier).to.contain('/-tasks/missing.ts');
  });

  it('accepts task config paths that start with dot-dot inside the Cell root', async () => {
    const root = await tempCell(
      'task-plan-dotcache-config',
      descriptor([leaf('capture', { config: './..cache/capture.yaml' })]),
    );

    const plan = await Cell.Task.plan(await Cell.load(root), 'capture');

    expect(plan.leaves[0].paths.config).to.eql(Fs.join(root, '..cache/capture.yaml'));
  });

  it('fails clearly for unknown roots and invalid descriptor graphs', async () => {
    const unknownRootError = await catchPlan(uncheckedCell([leafDescriptor('capture')]), 'missing');
    const missingRefError = await catchPlan(
      uncheckedCell([compositeDescriptor('all', ['missing'])]),
      'all',
    );
    const cycleError = await catchPlan(
      uncheckedCell([
        compositeDescriptor('one', ['two']),
        compositeDescriptor('two', ['one']),
      ]),
      'one',
    );

    expect(unknownRootError?.message).to.eql("Cell.Task.plan: unknown task 'missing'.");
    expect(missingRefError?.message).to.eql(
      "Cell.Task.plan: task 'all' references unknown task 'missing'.",
    );
    expect(cycleError?.message).to.eql(
      'Cell.Task.plan: task cycle detected: one -> two -> one',
    );
  });

  it('fails clearly for reachable address and config violations', async () => {
    const untrustedError = await catchPlan(
      uncheckedCell([leafDescriptor('capture', { from: 'npm:fake-package' })]),
      'capture',
    );
    const absoluteError = await catchPlan(
      uncheckedCell([leafDescriptor('capture', { from: Fs.join(Fs.resolve('.'), 'task.ts') })]),
      'capture',
    );
    const escapingImportError = await catchPlan(
      uncheckedCell([leafDescriptor('capture', { from: './../task.ts' })]),
      'capture',
    );
    const escapingConfigError = await catchPlan(
      uncheckedCell([leafDescriptor('capture', { config: './../config.yaml' })]),
      'capture',
    );

    expect(untrustedError?.message).to.eql(
      "Cell.Task.plan: untrusted task import for 'capture': npm:fake-package",
    );
    expect(absoluteError?.message).to.contain(
      "Cell.Task.plan: absolute task import for 'capture' is not allowed:",
    );
    expect(escapingImportError?.message).to.eql(
      "Cell.Task.plan: local task import for 'capture' escapes Cell root: ./../task.ts",
    );
    expect(escapingConfigError?.message).to.eql(
      "Cell.Task.plan: config for 'capture' escapes Cell root: ./../config.yaml",
    );
  });
});

/**
 * Helpers:
 */
type ImportGlobal = typeof globalThis & { __cellTaskPlanImports?: string[] };

async function catchPlan(
  cell: t.Cell.Instance,
  name: t.Cell.Id,
): Promise<Error | undefined> {
  try {
    await Cell.Task.plan(cell, name);
  } catch (err) {
    return err as Error;
  }
}

function resetImports() {
  (globalThis as ImportGlobal).__cellTaskPlanImports = [];
}

function importEvents(): readonly string[] {
  return (globalThis as ImportGlobal).__cellTaskPlanImports ?? [];
}

async function writeTask(root: string, path: string, source: string) {
  await Fs.write(Fs.join(root, path), source, { force: true });
}

function descriptor(tasks: readonly string[]) {
  const header = Str.dedent(`
    kind: cell
    version: 1

    tasks:
  `).trimStart();
  return `${header}\n${Str.indent(tasks.join('\n'), 2)}\n`;
}

function leaf(
  name: string,
  overrides: Partial<t.Cell.Task.Leaf> = {},
  withConfig = true,
) {
  const task: t.Cell.Task.Leaf = leafDescriptor(name, overrides);
  const config = withConfig ? task.config ?? './-config/capture.yaml' : undefined;
  const source = Str.dedent(`
    - name: ${task.name}
      use: ${task.use}
      from: ${task.from}
  `).trimStart();
  return config ? `${source}\n  config: ${config}\n` : `${source}\n`;
}

function composite(name: string, tasks: readonly string[]) {
  const source = Str.dedent(`
    - name: ${name}
      steps:
  `).trimStart();
  const steps = tasks.map((task) => `- task: ${task}`).join('\n');
  return `${source}\n${Str.indent(steps, 4)}\n`;
}

function leafDescriptor(
  name: t.Cell.Id,
  overrides: Partial<t.Cell.Task.Leaf> = {},
): t.Cell.Task.Leaf {
  return {
    name,
    use: 'CaptureTask',
    from: './-tasks/capture.ts',
    config: './-config/capture.yaml',
    ...overrides,
  };
}

function compositeDescriptor(
  name: t.Cell.Id,
  tasks: readonly t.Cell.Id[],
): t.Cell.Task.Composite {
  return { name, steps: tasks.map((task) => ({ task })) };
}

function uncheckedCell(tasks: readonly t.Cell.Task.Descriptor[]): t.Cell.Instance {
  return {
    root: CELL_ROOT,
    paths: { descriptor: Fs.join(CELL_ROOT, '-config/@sys.cell/cell.yaml') },
    descriptor: { kind: 'cell', version: 1, tasks: [...tasks] },
  };
}

function mutatingImportTaskSource(exportName: string) {
  return Str.dedent(`
    const g = globalThis as unknown as { __cellTaskPlanImports?: string[] };
    g.__cellTaskPlanImports ??= [];
    g.__cellTaskPlanImports.push('${exportName}');

    export const ${exportName} = {
      run() {
        return { ok: true };
      },
    };
  `).trimStart();
}
