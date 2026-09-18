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
            runAction() {
              return Promise.resolve({ ok: false });
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

  it('re-enters the same endpoint only after nested-preview back cleanup settles', async () => {
    await withPreviewDist(async ({ cwd }) => {
      const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
      await Fs.ensureDir(Fs.dirname(yamlPath));
      await Fs.write(yamlPath, ENDPOINT_YAML);

      const cleanupEntered = Promise.withResolvers<void>();
      const releaseCleanup = Promise.withResolvers<void>();
      const events: string[] = [];
      let prompts = 0;
      const pending = endpointMenuWith(
        { cwd, key: 'sample' },
        {
          promptAction() {
            prompts += 1;
            events.push(`prompt:${prompts}`);
            return Promise.resolve(prompts === 1 ? 'preview' : 'back');
          },
          async runAction(input) {
            events.push(`serve:${input.action}`);
            cleanupEntered.resolve();
            await releaseCleanup.promise;
            events.push('serve:clean');
            return { ok: true, preview: { kind: 'back' } };
          },
        },
      );

      await cleanupEntered.promise;
      expect(prompts).to.eql(1);
      releaseCleanup.resolve();
      expect(await pending).to.eql({ kind: 'back' });
      expect(events).to.eql(['prompt:1', 'serve:preview', 'serve:clean', 'prompt:2']);
    });
  });

  it('exits the endpoint menu when nested serving closes', async () => {
    await withPreviewDist(async ({ cwd }) => {
      const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
      await Fs.ensureDir(Fs.dirname(yamlPath));
      await Fs.write(yamlPath, ENDPOINT_YAML);

      let prompts = 0;
      const result = await endpointMenuWith(
        { cwd, key: 'sample' },
        {
          promptAction() {
            prompts += 1;
            return Promise.resolve('preview' as const);
          },
          runAction() {
            return Promise.resolve({ ok: true, preview: { kind: 'closed' as const } });
          },
        },
      );

      expect(result).to.eql({ kind: 'closed' });
      expect(prompts).to.eql(1);
    });
  });
});
