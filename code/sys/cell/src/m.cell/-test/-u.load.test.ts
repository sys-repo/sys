import { describe, expect, Fs, it, Str } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { CellPaths } from '../u.paths.ts';
import { catchLoad, sampleRoot, tempCell } from './u.fixture.ts';

describe('Cell.load', () => {
  it('loads and validates the Stripe sample descriptor', async () => {
    const root = sampleRoot();
    const cell = await Cell.load(root);

    expect(cell.root).to.eql(Fs.resolve(root));
    expect(cell.paths.descriptor).to.eql(Fs.join(cell.root, CellPaths.legacy.descriptor));
    expect(cell.descriptor.kind).to.eql('cell');
    expect(cell.descriptor.version).to.eql(1);
    expect(cell.descriptor.services?.map((service) => service.name)).to.eql([
      'ui:static:views',
      'stripe:dev:fixture',
      'cell:proxy',
    ]);
  });

  it('defaults to the process cwd when no root is given', async () => {
    const error = await catchLoad();
    const canonical = Fs.join(Fs.cwd('process'), CellPaths.descriptor);
    const legacy = Fs.join(Fs.cwd('process'), CellPaths.legacy.descriptor);

    expect(error?.message).to.contain('Cell.load: failed to find descriptor.');
    expect(error?.message).to.contain(canonical);
    expect(error?.message).to.contain(legacy);
  });

  it('loads and validates the Deploy sample descriptor', async () => {
    const root = new URL('../../../-sample/cell.deploy', import.meta.url).pathname;
    const cell = await Cell.load(root);

    expect(cell.root).to.eql(Fs.resolve(root));
    expect(cell.paths.descriptor).to.eql(Fs.join(cell.root, CellPaths.legacy.descriptor));
    expect(cell.descriptor.kind).to.eql('cell');
    expect(cell.descriptor.version).to.eql(1);
    expect(cell.descriptor.services?.map((service) => service.name)).to.eql(['deploy:view']);
  });

  it('loads canonical descriptors before legacy fallback is needed', async () => {
    const root = Fs.resolve('./.tmp/cell.load/canonical');
    const descriptor = Fs.join(root, CellPaths.descriptor);
    await Fs.write(descriptor, `kind: cell\nversion: 1\n`, { force: true });

    const cell = await Cell.load(root);

    expect(cell.paths.descriptor).to.eql(descriptor);
    expect(cell.compatibility).to.eql(undefined);
    expect(cell.descriptor).to.eql({ kind: 'cell', version: 1 });
  });

  it('loads legacy descriptors with a clear compatibility note', async () => {
    const root = await tempCell('legacy-fallback', `kind: cell\nversion: 1\n`);
    const legacyDescriptor = Fs.join(root, CellPaths.legacy.descriptor);
    const canonicalDescriptor = Fs.join(root, CellPaths.descriptor);

    const cell = await Cell.load(root);

    expect(cell.paths.descriptor).to.eql(legacyDescriptor);
    expect(cell.compatibility).to.eql({
      kind: 'legacy-descriptor',
      message:
        `Cell.load: loaded legacy descriptor ${legacyDescriptor}. Move it to ${canonicalDescriptor}; legacy fallback is temporary.`,
      legacyDescriptor,
      canonicalDescriptor,
    });
  });

  it('fails clearly when canonical and legacy descriptors both exist', async () => {
    const root = await tempCell('ambiguous-descriptor', `kind: cell\nversion: 1\n`);
    await Fs.write(Fs.join(root, CellPaths.descriptor), `kind: cell\nversion: 1\n`, { force: true });

    const error = await catchLoad(root);

    expect(error?.message).to.contain('Cell.load: multiple descriptors found:');
    expect(error?.message).to.contain(CellPaths.descriptor);
    expect(error?.message).to.contain(CellPaths.legacy.descriptor);
  });

  it('loads and validates descriptors with task composition', async () => {
    const root = await tempCell(
      'tasks',
      Str.dedent(`
        kind: cell
        version: 1

        tasks:
          - name: pull:view
            use: PullViewTask
            from: ./-tasks/pull.view.ts
            config: ./-config/@sys.tools.pull/view.yaml

          - name: deploy:stage
            use: DeployStageTask
            from: ./-tasks/deploy.stage.ts
            config: ./-config/@sys.tools.deploy/stage.yaml

          - name: clean:tmp
            use: CleanTmpTask
            from: ./-tasks/clean.tmp.ts

          - name: sample:deploy
            steps:
              - task: pull:view
              - task: deploy:stage
      `).trimStart(),
    );

    const cell = await Cell.load(root);

    expect(cell.descriptor.tasks?.map((task) => task.name)).to.eql([
      'pull:view',
      'deploy:stage',
      'clean:tmp',
      'sample:deploy',
    ]);
    expect(cell.descriptor.tasks?.[2]).to.eql({
      name: 'clean:tmp',
      use: 'CleanTmpTask',
      from: './-tasks/clean.tmp.ts',
    });
    expect(cell.descriptor.tasks?.[3]).to.eql({
      name: 'sample:deploy',
      steps: [{ task: 'pull:view' }, { task: 'deploy:stage' }],
    });
  });

  it('fails clearly when the descriptor is missing', async () => {
    const root = Fs.resolve('./.tmp/cell.missing');
    const error = await catchLoad(root);

    expect(error?.message).to.contain('Cell.load: failed to find descriptor.');
    expect(error?.message).to.contain(Fs.join(root, CellPaths.descriptor));
    expect(error?.message).to.contain(Fs.join(root, CellPaths.legacy.descriptor));
  });

  it('fails clearly when descriptor YAML is invalid', async () => {
    const root = await tempCell('invalid-yaml', `kind: cell:\n`);
    const error = await catchLoad(root);

    expect(error?.message).to.contain('Cell.load: failed to parse descriptor YAML:');
    expect(error?.message).to.contain(CellPaths.legacy.descriptor);
  });

  it('fails clearly when descriptor schema is invalid', async () => {
    const root = await tempCell('invalid-schema', `kind: cell\nversion: 1\ndsl:\n  root: data\n`);
    const error = await catchLoad(root);

    expect(error?.message).to.contain('Cell.load: invalid descriptor:');
    expect(error?.message).to.contain('/dsl');
  });
});
