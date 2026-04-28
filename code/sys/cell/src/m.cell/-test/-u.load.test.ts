import { describe, expect, Fs, it } from '../../-test.ts';
import { Cell } from '../mod.ts';
import type { t } from '../common.ts';

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

    let error: Error | undefined;
    try {
      await Cell.load(root);
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.contain('Cell.load: failed to read descriptor:');
    expect(error?.message).to.contain('-config/@sys.cell/cell.yaml');
  });
});

function sampleRoot(): t.StringDir {
  return new URL('../../../-sample/cell.stripe', import.meta.url).pathname;
}
