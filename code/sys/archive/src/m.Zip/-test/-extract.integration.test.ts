import { Fs } from '@sys/fs';
import { describe, expect, it, type t } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

const WORK = { timeout: 10_000 };

describe('@sys/archive/zip: owned tree sink interoperability', () => {
  it('landed Rooted writer → structurally compatible sink, private construction, explicit publication', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'zip.extract.' })).absolute;
    try {
      const rooted = await Fs.Capability.Rooted.create({ root });
      const { targets: [target] } = await rooted.Target.admit([{
        kind: 'directory',
        path: 'result',
      }]);
      const stage = await rooted.Stage.create();
      // This assignment proves the two public owner contracts compose without an adapter or cast.
      const sink: t.Zip.Extract.TreeSink = stage.writer;
      const archive = await Zip.open(
        Fixture.zip([
          { name: 'deep/stored.txt', data: 'stored' },
          { name: 'deep/deflated.txt', data: 'deflated', method: 8 },
          { name: 'empty' },
        ]).bytes,
        WORK,
      );
      expect(await archive.extractTo(sink, WORK)).to.eql({
        kind: 'extracted',
        fileCount: 3,
        directoryCount: 1,
        treeEntryCount: 4,
        expandedBytes: 14,
      });
      expect(await Fs.exists(Fs.join(root, 'result'))).to.eql(false);
      expect((await Fs.readText(Fs.join(stage.path, 'deep/stored.txt'))).data).to.eql('stored');
      expect((await Fs.readText(Fs.join(stage.path, 'deep/deflated.txt'))).data).to.eql('deflated');
      expect(await rooted.Stage.promote(stage, target)).to.eql({ kind: 'published' });
      expect((await Fs.readText(Fs.join(root, 'result/deep/deflated.txt'))).data).to.eql(
        'deflated',
      );
      await rooted.Stage.discard(stage);
    } finally {
      await Fs.remove(root);
    }
  });

  it('README outcomes → publication warning survives a discard failure without deleting the target', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'zip.extract.outcome.' })).absolute;
    try {
      const rooted = await Fs.Capability.Rooted.create({ root });
      const { targets: [target] } = await rooted.Target.admit([{
        kind: 'directory',
        path: './unpacked',
      }]);
      const stage = await rooted.Stage.create();
      const archive = await Zip.open(
        Fixture.zip([{ name: 'a.txt', data: 'published' }]).bytes,
        WORK,
      );
      const warning = new Error('promotion cleanup warning');
      const discardError = new Error('discard failure');
      let discardCalls = 0;
      const report = await exampleOutcome(async () => {
        const result = await archive.extractTo(stage.writer, WORK);
        const published = await rooted.Stage.promote(stage, target);
        // Model warning delivery here; Rooted's own fault-injection tests prove its production.
        const publication = { ...published, cleanupError: warning };
        return { result, publication };
      }, async () => {
        discardCalls++;
        await rooted.Stage.discard(stage);
        throw discardError;
      });

      expect(report.outcome.ok).to.eql(true);
      expect(report.cleanup.ok).to.eql(false);
      if (!report.outcome.ok || report.cleanup.ok) throw new Error('Expected separate outcomes');
      expect(report.outcome.value.publication.kind).to.eql('published');
      expect(report.outcome.value.publication.cleanupError).to.equal(warning);
      expect(report.outcome.value.result.expandedBytes).to.eql(9);
      expect(report.cleanup.error).to.equal(discardError);
      expect(discardCalls).to.eql(1);
      expect((await Fs.readText(Fs.join(root, 'unpacked/a.txt'))).data).to.eql('published');
    } finally {
      await Fs.remove(root);
    }
  });

  it('README outcomes → extraction failure survives a discard failure without publication', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'zip.extract.outcome.' })).absolute;
    try {
      const rooted = await Fs.Capability.Rooted.create({ root });
      const { targets: [target] } = await rooted.Target.admit([{
        kind: 'directory',
        path: './unpacked',
      }]);
      const stage = await rooted.Stage.create();
      const archive = await Zip.open(
        Fixture.zip([{ name: 'a.txt', data: 'corrupt', crc32: 0 }]).bytes,
        WORK,
      );
      const discardError = new Error('discard failure');
      let primary: unknown;
      let promotionCalls = 0;
      let discardCalls = 0;
      const report = await exampleOutcome(async () => {
        const result = await archive.extractTo(stage.writer, WORK).catch((error: unknown) => {
          primary = error;
          throw error;
        });
        promotionCalls++;
        const publication = await rooted.Stage.promote(stage, target);
        return { result, publication };
      }, () => {
        discardCalls++;
        return Promise.reject(discardError);
      });

      expect(report.outcome.ok).to.eql(false);
      expect(report.cleanup.ok).to.eql(false);
      if (report.outcome.ok || report.cleanup.ok) throw new Error('Expected both failures');
      expect(report.outcome.error).to.equal(primary);
      expect(Zip.Is.failure(primary)).to.eql(true);
      expect(primary).to.include({ operation: 'extract', kind: 'crc-mismatch' });
      expect(report.cleanup.error).to.equal(discardError);
      expect(promotionCalls).to.eql(0);
      expect(discardCalls).to.eql(1);
      expect(await Fs.exists(stage.path)).to.eql(true);
      expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
      await rooted.Stage.discard(stage);
      expect(await Fs.exists(stage.path)).to.eql(false);
    } finally {
      await Fs.remove(root);
    }
  });

  it('cancellation through the concrete writer → unpromoted private work, joined source, owned discard', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'zip.extract.cancel.' })).absolute;
    try {
      const rooted = await Fs.Capability.Rooted.create({ root });
      const { targets: [target] } = await rooted.Target.admit([{
        kind: 'directory',
        path: 'result',
      }]);
      const stage = await rooted.Stage.create();
      const controller = new AbortController();
      const archive = await Zip.open(
        Fixture.zip([{ name: 'a', data: new Uint8Array(128 * 1024), method: 8 }]).bytes,
        WORK,
      );
      let error: unknown;
      try {
        await archive.extractTo({
          async writeTree(entries, options) {
            const wrapped = entries.map((entry): t.Zip.Extract.TreeEntry =>
              entry.kind === 'directory' ? entry : {
                ...entry,
                content: {
                  async *[Symbol.asyncIterator]() {
                    for await (const chunk of entry.content) {
                      yield chunk;
                      controller.abort();
                    }
                  },
                },
              }
            );
            await stage.writer.writeTree(wrapped, options);
          },
        }, { ...WORK, until: controller.signal });
      } catch (cause) {
        error = cause;
      }
      expect(Zip.Is.failure(error)).to.eql(true);
      expect(error).to.include({ operation: 'extract', kind: 'cancelled' });
      let promoted = false;
      try {
        await rooted.Stage.promote(stage, target);
        promoted = true;
      } catch { /* Failed writer refuses promotion. */ }
      expect(promoted).to.eql(false);
      await rooted.Stage.discard(stage);
      expect(await Fs.exists(Fs.join(root, 'result'))).to.eql(false);
      await archive.test(WORK);
    } finally {
      await Fs.remove(root);
    }
  });
});

/** README outcome handling, with callbacks for controlled operation and discard failures. */
async function exampleOutcome<T>(publish: () => Promise<T>, discard: () => Promise<void>) {
  let outcome;
  try {
    outcome = { ok: true as const, value: await publish() };
  } catch (error) {
    outcome = { ok: false as const, error };
  }

  let cleanup;
  try {
    await discard();
    cleanup = { ok: true as const };
  } catch (error) {
    cleanup = { ok: false as const, error };
  }
  return { outcome, cleanup };
}
