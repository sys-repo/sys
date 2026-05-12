import { describe, expect, Fs, it, Str, type t } from '../../../-test.ts';
import { Cell } from '../../mod.ts';
import { tempCell } from '../../-test/u.fixture.ts';

describe('Cell.Action.run', () => {
  it('runs a leaf root action with structured args', async () => {
    resetEvents();
    const root = await tempCell(
      'action-run-leaf',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CaptureAction', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    const res = await Cell.Action.run(cell, 'capture');
    const event = events()[0];

    expect(res.action.name).to.eql('capture');
    expect(res.steps.length).to.eql(1);
    expect(res.steps[0].ok).to.eql(true);
    expect(res.steps[0].result).to.eql({ name: 'capture', value: 'from-config' });
    expect(res.steps[0].metrics.run.resolvedAt).to.be.at.least(
      res.steps[0].metrics.run.startedAt,
    );
    expect(event.name).to.eql('capture');
    expect(event.args.cwd).to.eql(root);
    expect(event.args.config).to.eql({ value: 'from-config' });
    expect(event.args.paths.config).to.eql(Fs.join(root, '-config/capture.yaml'));
  });

  it('runs composite actions in referenced root-action order', async () => {
    resetEvents();
    const root = await tempCell(
      'action-run-composite',
      descriptor([
        leaf('pull:view', { from: './-actions/pull.ts', export: 'PullAction' }, false),
        leaf('deploy:stage', { from: './-actions/deploy.ts', export: 'DeployAction' }, false),
        composite('sample:deploy', ['pull:view', 'deploy:stage']),
      ]),
    );
    await writeAction(root, './-actions/pull.ts', actionSource('PullAction', 'pull:view'));
    await writeAction(root, './-actions/deploy.ts', actionSource('DeployAction', 'deploy:stage'));

    const res = await Cell.Action.run(await Cell.load(root), 'sample:deploy');

    expect(events().map((event) => event.name)).to.eql(['pull:view', 'deploy:stage']);
    expect(res.action.name).to.eql('sample:deploy');
    expect(res.steps.map((step) => step.action.name)).to.eql(['pull:view', 'deploy:stage']);
    expect(res.steps.every((step) => step.ok)).to.eql(true);
    expect(res.steps.map((step) => step.result)).to.eql([
      { name: 'pull:view' },
      { name: 'deploy:stage' },
    ]);
  });

  it('passes configless leaf actions without config or paths.config', async () => {
    resetEvents();
    const root = await tempCell(
      'action-run-configless',
      descriptor([leaf('clean:tmp', { export: 'CleanAction' }, false)]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CleanAction', 'clean:tmp'));

    await Cell.Action.run(await Cell.load(root), 'clean:tmp');
    const event = events()[0];

    expect(event.name).to.eql('clean:tmp');
    expect(event.args).to.not.have.property('config');
    expect(event.args.paths).to.eql({});
  });

  it('allows runArgs to adapt final leaf action args', async () => {
    resetEvents();
    const root = await tempCell(
      'action-run-args-hook',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CaptureAction', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    let hookInput: t.Cell.Action.RunArgsInput | undefined;
    const res = await Cell.Action.run(await Cell.load(root), 'capture', {
      runArgs(input) {
        hookInput = input;
        return { ...input.base, config: { ...(input.base.config ?? {}), value: 'from-hook' } };
      },
    });

    expect(hookInput?.root.name).to.eql('capture');
    expect(hookInput?.action.action.name).to.eql('capture');
    expect(hookInput?.base.config).to.eql({ value: 'from-config' });
    expect(res.steps[0].result).to.eql({ name: 'capture', value: 'from-hook' });
  });

  it('stops on first failing referenced action', async () => {
    resetEvents();
    const root = await tempCell(
      'action-run-failing-composite',
      descriptor([
        leaf('first', { from: './-actions/first.ts', export: 'FirstAction' }, false),
        leaf('fail', { from: './-actions/fail.ts', export: 'FailAction' }, false),
        leaf('after', { from: './-actions/after.ts', export: 'AfterAction' }, false),
        composite('all', ['first', 'fail', 'after']),
      ]),
    );
    await writeAction(root, './-actions/first.ts', actionSource('FirstAction', 'first'));
    await writeAction(root, './-actions/fail.ts', failingActionSource('FailAction', 'fail'));
    await writeAction(root, './-actions/after.ts', actionSource('AfterAction', 'after'));

    const error = await catchRun(await Cell.load(root), 'all');

    expect(error?.message).to.eql("Cell.Action.run: failed action 'fail' while running 'all'.");
    expect(events().map((event) => event.name)).to.eql(['first', 'fail']);
  });
});

/**
 * Helpers:
 */
type ActionEvent = {
  readonly name: string;
  readonly args: t.Cell.Action.RunArgs;
};

type ActionGlobal = typeof globalThis & { __cellActionEvents?: ActionEvent[] };

async function catchRun(
  cell: Awaited<ReturnType<typeof Cell.load>>,
  name: t.Cell.Id,
): Promise<Error | undefined> {
  try {
    await Cell.Action.run(cell, name);
  } catch (err) {
    return err as Error;
  }
}

function resetEvents() {
  (globalThis as ActionGlobal).__cellActionEvents = [];
}

function events(): readonly ActionEvent[] {
  return (globalThis as ActionGlobal).__cellActionEvents ?? [];
}

async function writeAction(root: string, path: string, source: string) {
  await Fs.write(Fs.join(root, path), source, { force: true });
}

function descriptor(actions: readonly string[]) {
  return `kind: cell\nversion: 1\n\nactions:\n${actions.join('\n')}\n`;
}

function leaf(
  name: string,
  overrides: Partial<t.Cell.Action.Leaf> = {},
  withConfig = true,
) {
  const action: t.Cell.Action.Leaf = {
    name,
    from: './-actions/capture.ts',
    export: 'CaptureAction',
    ...overrides,
  };
  if (withConfig) action.config = overrides.config ?? './-config/capture.yaml';

  return [
    `  - name: ${action.name}`,
    `    from: ${action.from}`,
    `    export: ${action.export}`,
    ...(action.config ? [`    config: ${action.config}`] : []),
  ].join('\n');
}

function composite(name: string, actions: readonly string[]) {
  return [
    `  - name: ${name}`,
    `    steps:`,
    ...actions.map((action) => `      - action: ${action}`),
  ].join('\n');
}

function actionSource(exportName: string, name: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const input = args as { readonly config?: { readonly value?: unknown } };
        const g = globalThis as unknown as { __cellActionEvents?: unknown[] };
        g.__cellActionEvents ??= [];
        g.__cellActionEvents.push({ name: '${name}', args });
        return { name: '${name}', ...(input.config?.value ? { value: input.config.value } : {}) };
      },
    };
  `).trimStart();
}

function failingActionSource(exportName: string, name: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const g = globalThis as unknown as { __cellActionEvents?: unknown[] };
        g.__cellActionEvents ??= [];
        g.__cellActionEvents.push({ name: '${name}', args });
        throw new Error('boom');
      },
    };
  `).trimStart();
}
