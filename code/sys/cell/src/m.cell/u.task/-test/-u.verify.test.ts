import { describe, expect, Fs, it, Str, type t } from '../../../-test.ts';
import { Cell } from '../../mod.ts';
import { tempCell } from '../../-test/u.fixture.ts';

describe('Cell.Task.verify', () => {
  it('verifies local leaf tasks with optional config', async () => {
    const root = await tempCell(
      'task-verify-local',
      descriptor([
        leaf('capture', { config: './-config/capture.yaml' }),
        leaf('clean', { use: 'CleanTask', from: './-tasks/clean.ts' }, false),
        composite('all', ['capture', 'clean']),
      ]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));
    await writeTask(root, './-tasks/clean.ts', taskSource('CleanTask', 'clean'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    const verified = await Cell.Task.verify(cell);

    expect(verified.tasks.map((task) => task.task.name)).to.eql([
      'capture',
      'clean',
      'all',
    ]);
    const capture = verified.tasks[0] as t.Cell.Task.VerifiedLeaf;
    const clean = verified.tasks[1] as t.Cell.Task.VerifiedLeaf;
    const all = verified.tasks[2];
    expect(capture.kind).to.eql('leaf');
    expect(capture).to.not.have.property('config');
    expect(capture.paths.config).to.eql(Fs.join(root, '-config/capture.yaml'));
    expect(clean.kind).to.eql('leaf');
    expect(clean).to.not.have.property('config');
    expect(clean.paths).to.eql({});
    expect(all.kind).to.eql('composite');
  });

  it('imports explicit JSR sys task refs through workspace resolution', async () => {
    const root = await tempCell(
      'task-verify-jsr-sys-ref',
      descriptor([leaf('capture', { use: 'pkg', from: 'jsr:@sys/cell' }, false)]),
    );

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.eql(
      "Cell.Task.verify: 'jsr:@sys/cell' use 'pkg' must expose run(...) for task 'capture'.",
    );
  });

  it('imports bare sys task refs through workspace resolution', async () => {
    const root = await tempCell(
      'task-verify-bare-sys-ref',
      descriptor([leaf('capture', { use: 'pkg', from: "'@sys/cell'" }, false)]),
    );

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.eql(
      "Cell.Task.verify: '@sys/cell' use 'pkg' must expose run(...) for task 'capture'.",
    );
  });

  it('does not read or parse task config refs', async () => {
    const root = await tempCell(
      'task-config-ref-only',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: bad:\n`, { force: true });

    const verified = await Cell.Task.verify(await Cell.load(root));
    const capture = verified.tasks[0] as t.Cell.Task.VerifiedLeaf;

    expect(capture.paths.config).to.eql(Fs.join(root, '-config/capture.yaml'));
    expect(capture).to.not.have.property('config');
  });

  it('rejects config paths that escape the Cell root', async () => {
    const root = await tempCell(
      'task-config-escapes-root',
      descriptor([leaf('capture', { config: './../outside.yaml' })]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.eql(
      "Cell.Task.verify: config for 'capture' escapes Cell root: ./../outside.yaml",
    );
  });

  it('rejects untrusted task imports by default', async () => {
    const root = await tempCell(
      'task-untrusted-import',
      descriptor([leaf('capture', { use: 'CaptureTask', from: 'npm:fake-package' }, false)]),
    );

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.eql(
      "Cell.Task.verify: untrusted task import for 'capture': npm:fake-package",
    );
  });

  it('rejects absolute and escaping local task imports', async () => {
    const absoluteRoot = await tempCell(
      'task-absolute-import',
      descriptor([leaf('capture', { from: Fs.join(Fs.resolve('.'), 'capture.ts') }, false)]),
    );
    const escapingRoot = await tempCell(
      'task-escaping-import',
      descriptor([leaf('capture', { from: './../capture.ts' }, false)]),
    );

    const absoluteError = await catchVerify(await Cell.load(absoluteRoot));
    const escapingError = await catchVerify(await Cell.load(escapingRoot));

    expect(absoluteError?.message).to.contain(
      "Cell.Task.verify: absolute task import for 'capture' is not allowed:",
    );
    expect(escapingError?.message).to.eql(
      "Cell.Task.verify: local task import for 'capture' escapes Cell root: ./../capture.ts",
    );
  });

  it('fails clearly for unknown task refs and task cycles', async () => {
    const missingRefError = await catchVerify(
      uncheckedCell([compositeDescriptor('all', ['missing'])]),
    );
    const cycleError = await catchVerify(
      uncheckedCell([
        compositeDescriptor('one', ['two']),
        compositeDescriptor('two', ['one']),
      ]),
    );

    expect(missingRefError?.message).to.eql(
      "Cell.Task.verify: task 'all' references unknown task 'missing'.",
    );
    expect(cycleError?.message).to.eql(
      'Cell.Task.verify: task cycle detected: one -> two -> one',
    );
  });

  it('fails clearly when task use target is missing or has no run function', async () => {
    const missingRoot = await tempCell(
      'task-missing-use',
      descriptor([leaf('capture', { use: 'MissingTask' }, false)]),
    );
    const noRunRoot = await tempCell(
      'task-use-no-run',
      descriptor([leaf('capture', { use: 'NoRunTask' }, false)]),
    );
    await writeTask(
      missingRoot,
      './-tasks/capture.ts',
      taskSource('CaptureTask', 'capture'),
    );
    await writeTask(noRunRoot, './-tasks/capture.ts', `export const NoRunTask = {};\n`);

    const missingError = await catchVerify(await Cell.load(missingRoot));
    const noRunError = await catchVerify(await Cell.load(noRunRoot));

    expect(missingError?.message).to.eql(
      "Cell.Task.verify: './-tasks/capture.ts' use 'MissingTask' must expose run(...) for task 'capture'.",
    );
    expect(noRunError?.message).to.eql(
      "Cell.Task.verify: './-tasks/capture.ts' use 'NoRunTask' must expose run(...) for task 'capture'.",
    );
  });
});

/**
 * Helpers:
 */
async function catchVerify(
  cell: Awaited<ReturnType<typeof Cell.load>>,
): Promise<Error | undefined> {
  try {
    await Cell.Task.verify(cell);
  } catch (err) {
    return err as Error;
  }
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
  const task: t.Cell.Task.Leaf = {
    name,
    use: 'CaptureTask',
    from: './-tasks/capture.ts',
    ...overrides,
  };
  if (withConfig) task.config = overrides.config ?? './-config/capture.yaml';

  const source = Str.dedent(`
    - name: ${task.name}
      use: ${task.use}
      from: ${task.from}
  `).trimStart();
  return task.config ? `${source}\n  config: ${task.config}\n` : `${source}\n`;
}

function composite(name: string, tasks: readonly string[]) {
  const source = Str.dedent(`
    - name: ${name}
      steps:
  `).trimStart();
  const steps = tasks.map((task) => `- task: ${task}`).join('\n');
  return `${source}\n${Str.indent(steps, 4)}\n`;
}

function compositeDescriptor(
  name: t.Cell.Id,
  tasks: readonly t.Cell.Id[],
): t.Cell.Task.Composite {
  return { name, steps: tasks.map((task) => ({ task })) };
}

function uncheckedCell(tasks: readonly t.Cell.Task.Descriptor[]): t.Cell.Instance {
  return {
    root: Fs.resolve('./.tmp/cell.task.unchecked'),
    paths: { descriptor: Fs.resolve('./.tmp/cell.task.unchecked/-config/@sys.cell/cell.yaml') },
    descriptor: { kind: 'cell', version: 1, tasks: [...tasks] },
  };
}

function taskSource(exportName: string, name: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const input = args as { readonly paths: { readonly config?: string } };
        const g = globalThis as unknown as { __cellTaskEvents?: unknown[] };
        g.__cellTaskEvents ??= [];
        g.__cellTaskEvents.push({ name: '${name}', args });
        return { name: '${name}', ...(input.paths.config ? { config: input.paths.config } : {}) };
      },
    };
  `).trimStart();
}
