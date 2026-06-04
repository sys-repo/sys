import { Cli, describe, expect, it } from '../../../-test.ts';
import { Fmt } from '../mod.ts';

describe('Deploy: endpointTable', () => {
  it('renders endpoint title in lowercase', async () => {
    const table = await Fmt.endpointTable(
      '/tmp',
      { name: 'r2-proof', file: '-config/@sys.tools.deploy/r2-proof.yaml' },
      { yaml: { mappings: [] } },
    );

    const text = Cli.stripAnsi(table.text);
    expect(text.includes('endpoint')).to.eql(true);
    expect(text.includes('Endpoint')).to.eql(false);
  });
});
