import { describe, expect, Fs, it } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { catchLoad, sampleRoot, tempCell } from './u.fixture.ts';

describe('Cell.load', () => {
  it('loads and validates the Stripe sample descriptor', async () => {
    const root = sampleRoot();
    const cell = await Cell.load(root);

    expect(cell.root).to.equal(Fs.resolve(root));
    expect(cell.paths.descriptor).to.equal(Fs.join(cell.root, '-config/@sys.cell/cell.yaml'));
    expect(cell.descriptor.kind).to.equal('cell');
    expect(cell.descriptor.version).to.equal(1);
    expect(Object.keys(cell.descriptor.views ?? {})).to.eql(['stripe.dev', 'hello']);
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
    expect(error?.message).to.contain('/dsl/root');
  });
});

