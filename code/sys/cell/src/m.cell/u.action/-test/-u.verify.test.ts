import { describe, expect, Fs, it, Str, type t } from '../../../-test.ts';
import { Cell } from '../../mod.ts';
import { tempCell } from '../../-test/u.fixture.ts';

describe('Cell.Action.verify', () => {
  it('verifies local leaf actions with optional config', async () => {
    const root = await tempCell(
      'action-verify-local',
      descriptor([
        leaf('capture', { config: './-config/capture.yaml' }),
        leaf('clean', { from: './-actions/clean.ts', export: 'CleanAction' }, false),
        composite('all', ['capture', 'clean']),
      ]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CaptureAction', 'capture'));
    await writeAction(root, './-actions/clean.ts', actionSource('CleanAction', 'clean'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    const verified = await Cell.Action.verify(cell);

    expect(verified.actions.map((action) => action.action.name)).to.eql([
      'capture',
      'clean',
      'all',
    ]);
    const capture = verified.actions[0] as t.Cell.Action.VerifiedLeaf;
    const clean = verified.actions[1] as t.Cell.Action.VerifiedLeaf;
    const all = verified.actions[2];
    expect(capture.kind).to.eql('leaf');
    expect(capture.config).to.eql({ value: 'from-config' });
    expect(capture.paths.config).to.eql(Fs.join(root, '-config/capture.yaml'));
    expect(clean.kind).to.eql('leaf');
    expect(clean).to.not.have.property('config');
    expect(clean.paths).to.eql({});
    expect(all.kind).to.eql('composite');
  });

  it('fails clearly when action config is missing', async () => {
    const root = await tempCell(
      'action-missing-config',
      descriptor([leaf('capture', { config: './-config/missing.yaml' })]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CaptureAction', 'capture'));

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.contain("Cell.Action.verify: failed to read config for 'capture':");
    expect(error?.message).to.contain('-config/missing.yaml');
  });

  it('fails clearly when action config YAML is invalid', async () => {
    const root = await tempCell(
      'action-invalid-config-yaml',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CaptureAction', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: bad:\n`, { force: true });

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.contain(
      "Cell.Action.verify: failed to parse config YAML for 'capture':",
    );
    expect(error?.message).to.contain('-config/capture.yaml');
  });

  it('fails clearly when action config is not an object', async () => {
    const root = await tempCell(
      'action-config-not-object',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CaptureAction', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `- bad\n`, { force: true });

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.contain(
      "Cell.Action.verify: config for 'capture' must be a YAML object:",
    );
    expect(error?.message).to.contain('-config/capture.yaml');
  });

  it('rejects config paths that escape the Cell root', async () => {
    const root = await tempCell(
      'action-config-escapes-root',
      descriptor([leaf('capture', { config: './../outside.yaml' })]),
    );
    await writeAction(root, './-actions/capture.ts', actionSource('CaptureAction', 'capture'));

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.eql(
      "Cell.Action.verify: config for 'capture' escapes Cell root: ./../outside.yaml",
    );
  });

  it('rejects untrusted action imports by default', async () => {
    const root = await tempCell(
      'action-untrusted-import',
      descriptor([leaf('capture', { from: 'npm:fake-package', export: 'CaptureAction' }, false)]),
    );

    const error = await catchVerify(await Cell.load(root));

    expect(error?.message).to.eql(
      "Cell.Action.verify: untrusted action import for 'capture': npm:fake-package",
    );
  });

  it('rejects absolute and escaping local action imports', async () => {
    const absoluteRoot = await tempCell(
      'action-absolute-import',
      descriptor([leaf('capture', { from: Fs.join(Fs.resolve('.'), 'capture.ts') }, false)]),
    );
    const escapingRoot = await tempCell(
      'action-escaping-import',
      descriptor([leaf('capture', { from: './../capture.ts' }, false)]),
    );

    const absoluteError = await catchVerify(await Cell.load(absoluteRoot));
    const escapingError = await catchVerify(await Cell.load(escapingRoot));

    expect(absoluteError?.message).to.contain(
      "Cell.Action.verify: absolute action import for 'capture' is not allowed:",
    );
    expect(escapingError?.message).to.eql(
      "Cell.Action.verify: local action import for 'capture' escapes Cell root: ./../capture.ts",
    );
  });

  it('fails clearly for unknown action refs and action cycles', async () => {
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
      "Cell.Action.verify: action 'all' references unknown action 'missing'.",
    );
    expect(cycleError?.message).to.eql(
      'Cell.Action.verify: action cycle detected: one -> two -> one',
    );
  });

  it('fails clearly when action export is missing or has no run function', async () => {
    const missingRoot = await tempCell(
      'action-missing-export',
      descriptor([leaf('capture', { export: 'MissingAction' }, false)]),
    );
    const noRunRoot = await tempCell(
      'action-export-no-run',
      descriptor([leaf('capture', { export: 'NoRunAction' }, false)]),
    );
    await writeAction(
      missingRoot,
      './-actions/capture.ts',
      actionSource('CaptureAction', 'capture'),
    );
    await writeAction(noRunRoot, './-actions/capture.ts', `export const NoRunAction = {};\n`);

    const missingError = await catchVerify(await Cell.load(missingRoot));
    const noRunError = await catchVerify(await Cell.load(noRunRoot));

    expect(missingError?.message).to.eql(
      "Cell.Action.verify: './-actions/capture.ts' export 'MissingAction' must expose run(...) for action 'capture'.",
    );
    expect(noRunError?.message).to.eql(
      "Cell.Action.verify: './-actions/capture.ts' export 'NoRunAction' must expose run(...) for action 'capture'.",
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
    await Cell.Action.verify(cell);
  } catch (err) {
    return err as Error;
  }
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

function compositeDescriptor(
  name: t.Cell.Id,
  actions: readonly t.Cell.Id[],
): t.Cell.Action.Composite {
  return { name, steps: actions.map((action) => ({ action })) };
}

function uncheckedCell(actions: readonly t.Cell.Action.Descriptor[]): t.Cell.Instance {
  return {
    root: Fs.resolve('./.tmp/cell.action.unchecked'),
    paths: { descriptor: Fs.resolve('./.tmp/cell.action.unchecked/-config/@sys.cell/cell.yaml') },
    descriptor: { kind: 'cell', version: 1, actions: [...actions] },
  };
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
