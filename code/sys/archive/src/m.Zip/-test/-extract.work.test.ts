import { describe, expect, it, type t, Time } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { extractTo } from '../u/u.extract.ts';
import { DEFAULT_LIMITS } from '../u/u.input.ts';
import { operation } from '../u/u.operation.ts';
import { parseZip } from '../u/u.parse.ts';
import { createInflater, payloadPass } from '../u/u.payload.ts';
import { Fixture } from './u.fixture.ts';
import { drain, rejected } from './u.fixture.extract.ts';

const WORK = { timeout: 10_000 };
const BLOCK = 64 * 1024;

describe('@sys/archive/zip: extraction work ownership', () => {
  it('native reader starts only on demand, backpressures while paused, and closes on return', async () => {
    const fixture = Fixture.zip([{ name: 'a', data: new Uint8Array(BLOCK * 8), method: 8 }]);
    await operation('extract', WORK, DEFAULT_LIMITS, async (context) => {
      const parsed = await parseZip(fixture.bytes, DEFAULT_LIMITS, context);
      let starts = 0;
      let closed = false;
      let inflater: ReturnType<typeof createInflater> | undefined;
      const pass = payloadPass(fixture.bytes, context, () => {
        starts++;
        inflater = createInflater();
        inflater.once('close', () => {
          closed = true;
        });
        return inflater;
      });
      const reader = pass.read(parsed.entries[0], context);
      expect(starts).to.eql(0);
      const first = await reader.next();
      expect(first.done).to.eql(false);
      expect(first.value?.byteLength).to.eql(BLOCK);
      expect(starts).to.eql(1);
      await Time.wait(10);
      expect(inflater!.readableFlowing).not.to.eql(true);
      expect(inflater!.readableLength).to.be.at.most(BLOCK);
      expect(inflater!.writableLength).to.be.at.most(BLOCK);
      await reader.return(undefined);
      expect(closed).to.eql(true);
      expect(inflater!.destroyed).to.eql(true);
    });
  });

  it('second-pass integrity is real → owner-only byte instrumentation cannot bypass verification', async () => {
    for (const method of [0, 8] as const) {
      const fixture = Fixture.zip([{ name: 'a', data: new Uint8Array(BLOCK * 2).fill(7), method }]);
      const parsed = await operation(
        'open',
        WORK,
        DEFAULT_LIMITS,
        (context) => parseZip(fixture.bytes, DEFAULT_LIMITS, context),
      );
      let sinkCalls = 0;
      let observed: t.Zip.Failure.Error | undefined;
      try {
        // This internal-owner fixture intentionally bypasses Zip.open's private copy, solely to
        // mutate between the two passes. No public API exposes that storage or this instrumentation.
        await extractTo(
          fixture.bytes,
          parsed,
          {
            async writeTree(entries: readonly t.Zip.Extract.TreeEntry[]) {
              sinkCalls++;
              fixture.bytes[parsed.entries[0].dataOffset] ^= 0xff;
              for (const entry of entries) {
                if (entry.kind === 'file') {
                  for await (const _chunk of entry.content) { /* Drain until integrity rejects. */ }
                }
              }
            },
          },
          WORK,
          DEFAULT_LIMITS,
        );
      } catch (error) {
        if (!Zip.Is.failure(error)) throw error;
        observed = error;
      }
      expect(sinkCalls).to.eql(1);
      expect(observed?.operation).to.eql('extract');
      expect(observed?.kind).to.eql(method === 0 ? 'crc-mismatch' : 'deflate-failure');
    }
  });

  it('second-pass size, CRC, expansion limits, compressed consumption, and finalization are independent checks', async () => {
    for (
      const [mode, kind] of [
        ['crc', 'crc-mismatch'],
        ['size', 'size-mismatch'],
        ['entry-limit', 'expanded-limit'],
        ['aggregate-limit', 'expanded-limit'],
        ['trailing', 'deflate-failure'],
        ['unfinished', 'deflate-failure'],
      ] as const
    ) {
      // One final DEFLATE stored block: LEN=3, NLEN=~3, literal bytes "abc".
      const fixture = Fixture.zip([{
        name: 'a',
        data: 'abc',
        method: 8,
        compressed: new Uint8Array([1, 3, 0, 252, 255, 97, 98, 99]),
      }]);
      const parsed = await operation(
        'open',
        WORK,
        DEFAULT_LIMITS,
        (context) => parseZip(fixture.bytes, DEFAULT_LIMITS, context),
      );
      // Owner-only instrumentation: public opening freezes metadata/policy and hides these bytes.
      // Change exactly one premise after preflight so no first-pass check can satisfy this proof.
      const metadata = { ...parsed.entries[0].metadata };
      const entry = { ...parsed.entries[0], metadata };
      const owned = { ...parsed, entries: [entry] };
      const limits = { ...DEFAULT_LIMITS };
      let calls = 0;
      await rejected(
        extractTo(
          fixture.bytes,
          owned,
          {
            async writeTree(entries: readonly t.Zip.Extract.TreeEntry[]) {
              calls++;
              if (mode === 'crc') fixture.bytes[entry.dataOffset + 5] ^= 1;
              if (mode === 'size') metadata.expandedBytes++;
              if (mode === 'entry-limit') limits.maxEntryBytes = 2;
              if (mode === 'aggregate-limit') limits.maxExpandedBytes = 2;
              if (mode === 'trailing') metadata.compressedBytes++; // Include one central-record byte.
              if (mode === 'unfinished') fixture.bytes[entry.dataOffset] = 0; // Clear only BFINAL.
              await drain(entries);
            },
          },
          WORK,
          limits,
        ),
        kind,
      );
      expect(calls).to.eql(1);
    }
  });
});
