import { Fs } from '@sys/fs';
import { describe, expect, it } from './common.ts';
import { unreconciledRename } from './u.fixture.extract.publication.ts';
import { rootedFailure, withArchive, withRooted } from './u.fixture.extract.ts';
import { context, failureText, rejection } from './u.fixture.ts';
import { extractTool } from './u.fixture.tools.ts';

describe('Pi: ZIP extraction / publication', () => {
  describe('destination ownership', () => {
    it('promotion race → occupied destination is untouched and private stage is discarded', async () => {
      await withArchive(async (root) => {
        let stagePath = '';
        const rooted = withRooted((actual) => ({
          ...actual,
          Stage: {
            ...actual.Stage,
            async promote(stage, target, input) {
              stagePath = stage.path;
              await Fs.write(Fs.join(root, 'unpacked/sentinel'), 'existing', { throw: true });
              return await actual.Stage.promote(stage, target, input);
            },
          },
        }));
        const tool = await extractTool(root, { rooted });
        await rejection(
          () =>
            tool.execute(
              'occupied',
              { path: 'a.zip', to: 'unpacked' },
              undefined,
              undefined,
              context(root),
            ),
          'destination became occupied',
        );
        expect((await Fs.readText(Fs.join(root, 'unpacked/sentinel'))).data).to.eql('existing');
        expect(await Fs.exists(Fs.join(root, 'unpacked/deep/a.txt'))).to.eql(false);
        expect(await Fs.exists(stagePath)).to.eql(false);
      });
    });

    it('lost private-tree identity → refuses publication and leaves foreign residue untouched', async () => {
      await withArchive(async (root) => {
        let stagePath = '';
        const stranded = Fs.join(root, 'stranded-stage');
        const rooted = withRooted((actual) => ({
          ...actual,
          Stage: {
            ...actual.Stage,
            async promote(stage, target, input) {
              stagePath = stage.path;
              await Fs.rename(stage.path, stranded);
              await Fs.write(Fs.join(stage.path, 'foreign'), 'not ours', { throw: true });
              return await actual.Stage.promote(stage, target, input);
            },
          },
        }));
        const tool = await extractTool(root, { rooted });
        await rejection(
          () =>
            tool.execute(
              'identity',
              { path: 'a.zip', to: 'unpacked' },
              undefined,
              undefined,
              context(root),
            ),
          'cleanup=failed',
        );
        expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
        expect((await Fs.readText(Fs.join(stagePath, 'foreign'))).data).to.eql('not ours');
        expect((await Fs.readText(Fs.join(stranded, 'deep/a.txt'))).data).to.eql('hello');
      });
    });
  });

  describe('uncertain publication', () => {
    for (const observation of ['destination', 'source'] as const) {
      it(`rename after effect → failed ${observation} observation retains destination and residue`, async () => {
        await withArchive(async (root) => {
          const fault = await unreconciledRename(root, observation);
          const tool = await extractTool(root, { rooted: fault.rooted });
          const message = await failureText(() =>
            tool.execute(
              'uncertain',
              { path: 'a.zip', to: 'unpacked' },
              undefined,
              undefined,
              context(root),
            )
          );
          expect(message).to.include('publication=uncertain');
          expect(message).not.to.include('publication=not published');
          expect(message).to.include('private stage retained');
          expect((await Fs.readText(Fs.join(fault.destination, 'deep/a.txt'))).data).to.eql(
            'hello',
          );
          expect(await Fs.exists(Fs.join(Fs.dirname(fault.stagePath), 'owner'))).to.eql(true);
          expect(fault.removals).to.eql(0);
        });
      });
    }
  });

  describe('known publication', () => {
    it('late cancellation → cannot rewrite already-selected publication', async () => {
      await withArchive(async (root) => {
        const controller = new AbortController();
        const rooted = withRooted((actual) => ({
          ...actual,
          Stage: {
            ...actual.Stage,
            async promote(stage, target, input) {
              const result = await actual.Stage.promote(stage, target, input);
              controller.abort();
              return result;
            },
          },
        }));
        const tool = await extractTool(root, { rooted });
        const result = await tool.execute(
          'late',
          { path: 'a.zip', to: 'unpacked' },
          controller.signal,
          undefined,
          context(root),
        );
        expect(result.details).to.include({ publication: 'published', cleanup: 'complete' });
      });
    });

    it('caller-reported cleanup fault → thrown failure preserves the complete destination', async () => {
      await withArchive(async (root) => {
        const failure = await rootedFailure(root);
        const rooted = withRooted((actual) => ({
          ...actual,
          Stage: {
            ...actual.Stage,
            async promote(stage, target, input) {
              const result = await actual.Stage.promote(stage, target, input);
              return { ...result, cleanupError: failure };
            },
          },
        }));
        const tool = await extractTool(root, { rooted });
        await rejection(
          () =>
            tool.execute(
              'warning',
              { path: 'a.zip', to: 'unpacked' },
              undefined,
              undefined,
              context(root),
            ),
          'publication=published',
        );
        expect((await Fs.readText(Fs.join(root, 'unpacked/deep/a.txt'))).data).to.eql('hello');
      });
    });
  });
});
