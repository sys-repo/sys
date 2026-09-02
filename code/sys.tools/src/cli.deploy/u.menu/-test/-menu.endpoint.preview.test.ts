import { Cli, describe, expect, Fs, it, Str } from '../../../-test.ts';
import { endpointMenuWith } from '../menu.endpoint.ts';
import { captureInfo } from '../../-test/u.fixture.ts';
import { withPreviewDist } from '../../-test/u.preview.fixture.ts';

const ENDPOINT_YAML = `staging:\n  dir: ./staging\n\nmappings: []\n`;

describe('Deploy: endpoint menu / preview authority', () => {
  it('freshly invalidates preview availability and metadata after a staged-tree mutation', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
      await Fs.ensureDir(Fs.dirname(yamlPath));
      await Fs.write(yamlPath, ENDPOINT_YAML);

      const generations: Array<{
        readonly showPreview: boolean;
        readonly hashPrefix: string;
        readonly stageAge?: string;
        readonly stageSize?: string;
        readonly hasStageMeta: boolean;
      }> = [];
      const captured = await captureInfo(() =>
        endpointMenuWith(
          { cwd, key: 'sample' },
          {
            async promptAction(input) {
              generations.push({
                showPreview: input.showPreview,
                hashPrefix: Cli.stripAnsi(input.hashPrefix),
                stageAge: input.stageAge,
                stageSize: input.stageSize,
                hasStageMeta: input.hasStageMeta,
              });
              if (generations.length === 1) {
                await Fs.write(`${root}/assets/app.js`, 'export const changed = true;\n');
                return 'reload';
              }
              return 'back';
            },
          },
        )
      );

      expect(captured.value).to.eql({ kind: 'back' });
      expect(generations).to.have.length(2);
      expect(generations[0]).to.contain({
        showPreview: true,
        hashPrefix: `#${String(evidence.dist.hash.digest).slice(-5)}`,
        stageSize: Str.bytes(evidence.assets.totalBytes),
        hasStageMeta: true,
      });
      expect(generations[0]?.stageAge).to.not.eql(undefined);
      expect(generations[1]).to.eql({
        showPreview: false,
        hashPrefix: '#     ',
        stageAge: undefined,
        stageSize: undefined,
        hasStageMeta: false,
      });

      const output = Cli.stripAnsi(captured.output);
      expect(output.split('Preview unavailable').length - 1).to.eql(1);
      expect(output.split('reason: content-mismatch').length - 1).to.eql(1);
    });
  });
});
