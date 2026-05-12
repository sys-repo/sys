import { describe, expect, Fs, it, Str } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { catchLoad, sampleRoot, tempCell } from './u.fixture.ts';

describe('Cell.load', () => {
  it('loads and validates the Stripe sample descriptor', async () => {
    const root = sampleRoot();
    const cell = await Cell.load(root);

    expect(cell.root).to.eql(Fs.resolve(root));
    expect(cell.paths.descriptor).to.eql(Fs.join(cell.root, '-config/@sys.cell/cell.yaml'));
    expect(cell.descriptor.kind).to.eql('cell');
    expect(cell.descriptor.version).to.eql(1);
    expect(cell.descriptor.runtime?.services.map((service) => service.name)).to.eql([
      'ui:static:views',
      'stripe:dev:fixture',
      'cell:proxy',
    ]);
  });

  it('loads and validates the Deploy sample descriptor', async () => {
    const root = new URL('../../../-sample/cell.deploy', import.meta.url).pathname;
    const cell = await Cell.load(root);

    expect(cell.root).to.eql(Fs.resolve(root));
    expect(cell.paths.descriptor).to.eql(Fs.join(cell.root, '-config/@sys.cell/cell.yaml'));
    expect(cell.descriptor.kind).to.eql('cell');
    expect(cell.descriptor.version).to.eql(1);
    expect(cell.descriptor.runtime).to.eql(undefined);
  });

  it('loads and validates descriptors with action composition', async () => {
    const root = await tempCell(
      'actions',
      Str.dedent(`
        kind: cell
        version: 1

        actions:
          - name: pull:view
            from: ./-actions/pull.view.ts
            export: PullViewAction
            config: ./-config/@sys.tools.pull/view.yaml

          - name: deploy:stage
            from: ./-actions/deploy.stage.ts
            export: DeployStageAction
            config: ./-config/@sys.tools.deploy/stage.yaml

          - name: clean:tmp
            from: ./-actions/clean.tmp.ts
            export: CleanTmpAction

          - name: sample:deploy
            steps:
              - action: pull:view
              - action: deploy:stage
      `).trimStart(),
    );

    const cell = await Cell.load(root);

    expect(cell.descriptor.actions?.map((action) => action.name)).to.eql([
      'pull:view',
      'deploy:stage',
      'clean:tmp',
      'sample:deploy',
    ]);
    expect(cell.descriptor.actions?.[2]).to.eql({
      name: 'clean:tmp',
      from: './-actions/clean.tmp.ts',
      export: 'CleanTmpAction',
    });
    expect(cell.descriptor.actions?.[3]).to.eql({
      name: 'sample:deploy',
      steps: [{ action: 'pull:view' }, { action: 'deploy:stage' }],
    });
  });

  it('fails clearly when the descriptor is missing', async () => {
    const root = Fs.resolve('./.tmp/cell.missing');
    const error = await catchLoad(root);

    expect(error?.message).to.contain('Cell.load: failed to read descriptor:');
    expect(error?.message).to.contain('-config/@sys.cell/cell.yaml');
  });

  it('fails clearly when descriptor YAML is invalid', async () => {
    const root = await tempCell('invalid-yaml', `kind: cell:\n`);
    const error = await catchLoad(root);

    expect(error?.message).to.contain('Cell.load: failed to parse descriptor YAML:');
    expect(error?.message).to.contain('-config/@sys.cell/cell.yaml');
  });

  it('fails clearly when descriptor schema is invalid', async () => {
    const root = await tempCell('invalid-schema', `kind: cell\nversion: 1\ndsl:\n  root: data\n`);
    const error = await catchLoad(root);

    expect(error?.message).to.contain('Cell.load: invalid descriptor:');
    expect(error?.message).to.contain('/dsl');
  });
});
