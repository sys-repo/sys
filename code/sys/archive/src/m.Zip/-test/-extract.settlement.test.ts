import { describe, expect, it, Schedule, type t } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { zip } from './u.fixture.ts';
import { drain, rejected } from './u.fixture.extract.ts';

const WORK = { timeout: 10_000 };
const BLOCK = 64 * 1024;

describe('@sys/archive/zip: retained content settlement', () => {
  it('sink throw, partial success, early return, and timeout → retained chunks cannot corrupt later operations', async () => {
    for (const method of [0, 8] as const) {
      const data = new Uint8Array(BLOCK * 3).fill(17);
      const fixture = zip([{ name: 'a', data, method }]);
      const archive = await Zip.open(fixture.bytes, WORK);
      const inspection = archive.inspect();
      // Extraction must not revisit the caller's source allocation, even after transfer.
      (fixture.bytes.buffer as ArrayBuffer).transfer();
      for (const mode of ['throw', 'partial', 'return', 'timeout'] as const) {
        let source: AsyncIterable<Uint8Array> | undefined;
        let iterator: AsyncIterator<Uint8Array> | undefined;
        let retained: Uint8Array | undefined;
        let rejectedSink: ((cause: unknown) => void) | undefined;
        const kind = mode === 'throw'
          ? 'sink-failure'
          : mode === 'timeout'
          ? 'timeout'
          : 'sink-protocol';
        await rejected(
          archive.extractTo({
            async writeTree(entries) {
              const file = entries.find((entry) => entry.kind === 'file');
              if (file?.kind !== 'file') throw new Error('Missing test file');
              source = file.content;
              iterator = source[Symbol.asyncIterator]();
              retained = (await iterator.next()).value;
              if (mode === 'throw') throw new Error('sink rejected with active content');
              if (mode === 'return') await iterator.return?.();
              if (mode === 'timeout') {
                await new Promise<void>((_resolve, reject) => {
                  rejectedSink = reject;
                });
              }
            },
          }, { timeout: mode === 'timeout' ? 100 : WORK.timeout }),
          kind,
        );
        expect(retained).to.be.instanceOf(Uint8Array);
        retained!.fill(255);
        (retained!.buffer as ArrayBuffer).transfer();
        rejectedSink?.(new Error('late external failure'));
        await Schedule.tick();
        await rejected(Promise.resolve().then(() => source![Symbol.asyncIterator]()), kind);
        await rejected(iterator!.next(), kind);
        await rejected(Promise.resolve().then(() => iterator!.return?.()), kind);
        expect(archive.inspect()).to.equal(inspection);
        expect((await archive.test(WORK)).expandedBytes).to.eql(data.byteLength);
        await archive.extractTo({ writeTree: drain }, WORK);
      }
    }
  });

  it('automatic for-await cleanup from a rejecting sink preserves sink-failure and revokes the source', async () => {
    for (const method of [0, 8] as const) {
      const archive = await Zip.open(
        zip([{ name: 'a', data: new Uint8Array(BLOCK * 2), method }]).bytes,
        WORK,
      );
      let content: AsyncIterable<Uint8Array> | undefined;
      await rejected(
        archive.extractTo({
          async writeTree(entries) {
            const entry = entries[0];
            if (entry.kind !== 'file') throw new Error('Missing test file');
            content = entry.content;
            for await (const _chunk of content) throw new Error('consumer body rejected');
          },
        }, WORK),
        'sink-failure',
      );
      await rejected(
        Promise.resolve().then(() => content![Symbol.asyncIterator]()),
        'sink-failure',
      );
      await archive.extractTo({ writeTree: drain }, WORK);
    }
  });

  it('return interrupts and joins pending next without replacing a rejecting sink with cleanup failure', async () => {
    for (const method of [0, 8] as const) {
      const archive = await Zip.open(
        zip([{ name: 'a', data: new Uint8Array(BLOCK * 2), method }]).bytes,
        WORK,
      );
      for (const throws of [false, true]) {
        await rejected(
          archive.extractTo({
            async writeTree(entries) {
              const entry = entries[0];
              if (entry.kind !== 'file') throw new Error('Missing test file');
              const iterator = entry.content[Symbol.asyncIterator]();
              const pending = iterator.next();
              const closing = iterator.return?.();
              await rejected(pending, 'sink-protocol');
              expect((await closing)?.done).to.eql(true);
              if (throws) throw new Error('sink failed while demand was pending');
            },
          }, WORK),
          throws ? 'sink-failure' : 'sink-protocol',
        );
        await archive.extractTo({ writeTree: drain }, WORK);
      }
    }
  });

  it('concurrent operations have independent consumption state and cancellation authority', async () => {
    const archive = await Zip.open(
      zip([{ name: 'a', data: new Uint8Array(BLOCK * 2), method: 8 }]).bytes,
      WORK,
    );
    const controller = new AbortController();
    const stopped = archive.extractTo({
      async writeTree(entries) {
        const entry = entries[0];
        if (entry.kind !== 'file') throw new Error('Missing test file');
        const iterator = entry.content[Symbol.asyncIterator]();
        await iterator.next();
        controller.abort();
        await iterator.next();
      },
    }, { ...WORK, until: controller.signal });
    const successful = archive.extractTo({ writeTree: drain }, WORK);
    const integrity = archive.test(WORK);
    const [, result, tested] = await Promise.all([
      rejected(stopped, 'cancelled'),
      successful,
      integrity,
    ]);
    expect(result.expandedBytes).to.eql(tested.expandedBytes);
    const extracted: t.Zip.ExtractResult = result;
    expect(Object.isFrozen(extracted)).to.eql(true);
  });
});
