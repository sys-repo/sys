import { Cli, describe, expect, Fs, it, Str } from '../../../-test.ts';
import { withPreviewDist } from '../../-test/u.preview.fixture.ts';
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

  it('renders mapping coverage only from supplied verification evidence', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      const bytes = new TextEncoder().encode('<h1>nested</h1>\n').byteLength;
      await Fs.remove(root);

      const table = await Fmt.endpointTable(
        cwd,
        { name: 'sample', file: '-config/@sys.tools.deploy/sample.yaml' },
        {
          yaml: {
            staging: { dir: './staging' },
            mappings: [
              {
                mode: 'copy',
                dir: { source: './source', staging: './guides & refs' },
              },
            ],
          },
          verification: evidence,
        },
      );

      const text = Cli.stripAnsi(table.text);
      expect(text).to.include(`1 file | ${Str.bytes(bytes)}`);
    });
  });
});
