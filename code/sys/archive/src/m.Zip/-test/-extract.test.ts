import { describe, Dispose, expect, Is, it, Schedule, type t, Time } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { Fixture } from './u.fixture.ts';
import { drain, rejected } from './u.fixture.extract.ts';

type Entries = readonly t.Zip.Extract.TreeEntry[];
const WORK = { timeout: 10_000 };
const BLOCK = 64 * 1024;

const discard: t.Zip.Extract.TreeSink = { writeTree: drain };
const files = (entries: Entries) => entries.filter((entry) => entry.kind === 'file');
async function call(fn: () => unknown) {
  return await fn();
}

/** Fixtures use the pinned APPNOTE constructor; each test states its sink/protocol expectation. */
describe('@sys/archive/zip: extraction', () => {
  it('empty and directory-only trees → one frozen complete batch and exact result', async () => {
    for (const names of [[], ['d/', 'd/e/']]) {
      const archive = await Zip.open(Fixture.zip(names.map((name) => ({ name }))).bytes, WORK);
      let called = 0;
      const result = await archive.extractTo({
        async writeTree(entries, options) {
          called++;
          expect(Object.isFrozen(entries)).to.eql(true);
          expect(entries.every(Object.isFrozen)).to.eql(true);
          expect(Object.isFrozen(options)).to.eql(true);
          expect(entries.map((entry) => entry.path)).to.eql(names.map((name) => name.slice(0, -1)));
          await drain(entries);
        },
      }, WORK);
      expect(called).to.eql(1);
      expect(Object.keys(archive).sort()).to.eql(['extractTo', 'inspect', 'test']);
      expect(result).to.eql({
        kind: 'extracted',
        fileCount: 0,
        directoryCount: names.length,
        treeEntryCount: names.length,
        expandedBytes: 0,
      });
      expect(Object.isFrozen(result)).to.eql(true);
    }
  });

  it('mixed files and implicit parents → physical file order, exact limits, and original payloads', async () => {
    const archive = await Zip.open(
      Fixture.zip([
        { name: 'deep/path/é.txt', data: 'stored' },
        { name: 'other/value', data: 'deflated', method: 8, descriptor: 'signed' },
        { name: 'deep/', creator: 3 },
        { name: 'zero', data: '', method: 8, descriptor: 'unsigned' },
      ]).bytes,
      { ...WORK, limits: { maxTreeEntries: 9, maxEntryBytes: 100, maxExpandedBytes: 200 } },
    );
    const before = archive.inspect();
    const result = await archive.extractTo({
      async writeTree(entries, options) {
        expect(entries.map((entry) => entry.path)).to.eql([
          'deep',
          'deep/path',
          'other',
          'deep/path/é.txt',
          'other/value',
          'zero',
        ]);
        expect(options).to.include({
          maxEntries: 9,
          maxPathBytes: 512,
          maxPathDepth: 32,
          maxFileBytes: 100,
          maxTreeBytes: 200,
        });
        expect(options.until.aborted).to.eql(false);
        expect(options.timeout).to.be.greaterThan(0).and.at.most(WORK.timeout);
        const texts: string[] = [];
        for (const entry of files(entries)) {
          expect(Object.isFrozen(entry.content)).to.eql(true);
          let text = '';
          for await (const chunk of entry.content) text += new TextDecoder().decode(chunk);
          texts.push(text);
        }
        expect(texts).to.eql(['stored', 'deflated', '']);
      },
    }, WORK);
    expect(result).to.eql({
      kind: 'extracted',
      fileCount: 3,
      directoryCount: 3,
      treeEntryCount: 6,
      expandedBytes: 14,
    });
    expect(archive.inspect()).to.equal(before);
    expect((await archive.test(WORK)).expandedBytes).to.eql(14);
  });

  it('hostile retention, mutation, and transfer → fresh bounded chunks never alias archive storage', async () => {
    for (const method of [0, 8] as const) {
      const input = new Uint8Array(BLOCK * 3 + 1).fill(7);
      const archive = await Zip.open(Fixture.zip([{ name: 'a', data: input, method }]).bytes, WORK);
      const retained: Uint8Array[] = [];
      await archive.extractTo({
        async writeTree(entries) {
          for await (const chunk of files(entries)[0].content) {
            expect(chunk.byteLength).to.be.greaterThan(0).and.at.most(BLOCK);
            expect(chunk.byteOffset).to.eql(0);
            expect(Object.getPrototypeOf(chunk)).to.equal(Uint8Array.prototype);
            expect(Object.getPrototypeOf(chunk.buffer)).to.equal(ArrayBuffer.prototype);
            expect(chunk.buffer.byteLength).to.eql(chunk.byteLength);
            expect(chunk.every((value) => value === 7)).to.eql(true);
            retained.push(chunk);
            chunk.fill(99);
            // The output contract promises an ordinary fixed ArrayBuffer, asserted above.
            (chunk.buffer as ArrayBuffer).transfer();
          }
        },
      }, WORK);
      expect(new Set(retained).size).to.eql(retained.length);
      expect(retained.length).to.be.greaterThan(1);
      expect((await archive.test(WORK)).expandedBytes).to.eql(input.byteLength);
      await archive.extractTo(discard, WORK);
    }
  });

  it('stored private views never invoke species or shadowable typed-array accessors after sink entry', async () => {
    const archive = await Zip.open(
      Fixture.zip([{ name: 'a', data: new Uint8Array(BLOCK * 2) }]).bytes,
      WORK,
    );
    let reads = 0;
    await archive.extractTo({
      async writeTree(entries) {
        const prototype = Uint8Array.prototype;
        const constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor')!;
        const length = Object.getOwnPropertyDescriptor(prototype, 'byteLength');
        try {
          const get = () => {
            reads++;
            throw new Error('private byte receiver exposed');
          };
          Object.defineProperty(prototype, 'constructor', { configurable: true, get });
          Object.defineProperty(prototype, 'byteLength', { configurable: true, get });
          await drain(entries);
        } finally {
          Object.defineProperty(prototype, 'constructor', constructor);
          if (length) Object.defineProperty(prototype, 'byteLength', length);
          else Reflect.deleteProperty(prototype, 'byteLength');
        }
      },
    }, WORK);
    expect(reads).to.eql(0);
    await archive.test(WORK);
  });

  it('corrupt payloads → preflight selects owner failure before any sink invocation', async () => {
    const cases: Array<{ data: Parameters<typeof Fixture.zip>[0]; kind: t.Zip.Failure.Kind }> = [
      { data: [{ name: 'a', data: 'abc', crc32: 0 }], kind: 'crc-mismatch' },
      { data: [{ name: 'a', data: 'abc', method: 8, expandedSize: 2 }], kind: 'size-mismatch' },
      {
        data: [{ name: 'a', data: 'abc', method: 8, compressed: new Uint8Array([255]) }],
        kind: 'deflate-failure',
      },
    ];
    for (const item of cases) {
      const archive = await Zip.open(Fixture.zip(item.data).bytes, WORK);
      let calls = 0;
      await rejected(
        archive.extractTo({
          writeTree() {
            calls++;
            return Promise.resolve();
          },
        }, WORK),
        item.kind,
      );
      expect(calls).to.eql(0);
    }
  });

  it('sink and option admission → exact own data, no proxy traps or accessor execution', async () => {
    const archive = await Zip.open(Fixture.zip().bytes, WORK);
    let reads = 0;
    const trap = () => {
      reads++;
      throw new Error('secret');
    };
    const sinks: unknown[] = [
      undefined,
      {},
      { writeTree: 1 },
      { writeTree: drain, extra: true },
      Object.create({ writeTree: drain }),
      Object.defineProperty({}, 'writeTree', { enumerable: true, get: trap }),
      new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap }),
      { writeTree: new Proxy(drain, { apply: trap }) },
    ];
    for (const sink of sinks) {
      await rejected(Reflect.apply(archive.extractTo, archive, [sink, WORK]), 'invalid-sink');
    }
    const badOptions = Object.defineProperty({}, 'timeout', { enumerable: true, get: trap });
    await rejected(
      Reflect.apply(archive.extractTo, archive, [discard, badOptions]),
      'invalid-options',
    );
    expect(reads).to.eql(0);
  });

  it('captured sink, options, and fan-in containers → caller mutation cannot redirect the operation', async () => {
    const archive = await Zip.open(Fixture.zip([{ name: 'a', data: 'value' }]).bytes, WORK);
    let calls = 0;
    const sink = {
      async writeTree(entries: Entries) {
        calls++;
        await drain(entries);
      },
    };
    const until: t.UntilInput[] = [undefined];
    const options = { timeout: 10_000, until };
    const pending = archive.extractTo(sink, options);
    sink.writeTree = () => {
      throw new Error('replaced');
    };
    options.timeout = 0;
    const stopped = Dispose.lifecycle();
    stopped.dispose();
    until.push(stopped); // Re-reading the caller's container would now cancel before the sink.
    await pending;
    expect(calls).to.eql(1);
  });

  it('pre-terminal inputs and zero budgets → no sink or payload work, subscriptions settle', async () => {
    const controller = new AbortController();
    controller.abort();
    const disposed = Dispose.lifecycle();
    disposed.dispose();
    let subscribed = 0;
    let unsubscribed = 0;
    const synchronous = {
      subscribe(next: (event: unknown) => void) {
        subscribed++;
        next({ reason: 'stop' });
        return {
          unsubscribe() {
            unsubscribed++;
          },
        };
      },
    };
    // Corruption would fail preflight if cancellation did not win first.
    const archive = await Zip.open(Fixture.zip([{ name: 'a', data: 'abc', crc32: 0 }]).bytes, WORK);
    for (const until of [controller.signal, disposed, synchronous]) {
      await rejected(
        Reflect.apply(archive.extractTo, archive, [discard, { ...WORK, until }]),
        'cancelled',
      );
    }
    await rejected(archive.extractTo(discard, { timeout: 0 }), 'timeout');
    expect(subscribed).to.eql(1);
    expect(unsubscribed).to.eql(1);
    const empty = await Zip.open(Fixture.zip().bytes, WORK);
    await empty.extractTo(discard, { ...WORK, until: Array(255).fill(undefined) });
    await rejected(
      empty.extractTo(discard, { ...WORK, until: Array(256).fill(undefined) }),
      'invalid-options',
    );
    let depth: t.UntilInput = undefined;
    for (let count = 0; count < 32; count++) depth = [depth];
    await empty.extractTo(discard, { ...WORK, until: depth });
    await rejected(empty.extractTo(discard, { ...WORK, until: [depth] }), 'invalid-options');
  });

  it('sink-thrown errors and borrowed branded errors → sink failure, never forged operation authority', async () => {
    const archive = await Zip.open(Fixture.zip().bytes, { ...WORK, limits: { maxErrorChars: 8 } });
    let reads = 0;
    const hostile = Object.defineProperty({}, 'message', {
      get() {
        reads++;
        throw new Error();
      },
    });
    let branded: unknown;
    try {
      await Zip.open(new Uint8Array(), WORK);
    } catch (error) {
      branded = error;
    }
    for (const cause of [hostile, branded, undefined]) {
      const error = await rejected(
        archive.extractTo({
          writeTree() {
            throw cause;
          },
        }, WORK),
        'sink-failure',
      );
      expect(error.message.length).to.be.at.most(8);
    }
    expect(reads).to.eql(0);
  });

  it('skipped, repeated, out-of-order, or overlapping demands → latched protocol failure even if caught', async () => {
    const archive = await Zip.open(
      Fixture.zip([{ name: 'a', data: 'a' }, { name: 'b', data: 'b' }]).bytes,
      WORK,
    );
    const violations: Array<(entries: Entries) => void | Promise<void>> = [
      () => {},
      (entries) => {
        files(entries)[1].content[Symbol.asyncIterator]();
      },
      (entries) => {
        const source = files(entries)[0].content;
        source[Symbol.asyncIterator]();
        source[Symbol.asyncIterator]();
      },
      async (entries) => {
        const iterator = files(entries)[0].content[Symbol.asyncIterator]();
        await Promise.allSettled([iterator.next(), iterator.next()]);
      },
      async (entries) => {
        const iterator = files(entries)[0].content[Symbol.asyncIterator]();
        await iterator.next();
        files(entries)[1].content[Symbol.asyncIterator]();
      },
    ];
    for (const violate of violations) {
      await rejected(
        archive.extractTo({
          async writeTree(entries) {
            try {
              await violate(entries);
            } catch { /* Hostile sink conceals failure. */ }
          },
        }, WORK),
        'sink-protocol',
      );
    }
  });

  it('early return → incomplete on sink success, sink-failure on rejection, never false completion', async () => {
    for (const method of [0, 8] as const) {
      const archive = await Zip.open(
        Fixture.zip([{ name: 'a', data: new Uint8Array(BLOCK * 2), method }]).bytes,
        WORK,
      );
      for (const throws of [false, true]) {
        await rejected(
          archive.extractTo({
            async writeTree(entries) {
              const iterator = files(entries)[0].content[Symbol.asyncIterator]();
              await iterator.next();
              await iterator.return?.();
              if (throws) throw new Error('sink failed after cleanup');
            },
          }, WORK),
          throws ? 'sink-failure' : 'sink-protocol',
        );
      }
      await archive.extractTo(discard, WORK);
    }
  });

  it('completed iterators are inert within the operation; all retained authority is revoked afterward', async () => {
    const archive = await Zip.open(Fixture.zip([{ name: 'zero' }]).bytes, WORK);
    let source: AsyncIterable<Uint8Array> | undefined;
    let iterator: AsyncIterator<Uint8Array> | undefined;
    await archive.extractTo({
      async writeTree(entries) {
        source = files(entries)[0].content;
        iterator = source[Symbol.asyncIterator]();
        expect((await iterator.next()).done).to.eql(true);
        expect((await iterator.next()).done).to.eql(true);
        expect((await iterator.return?.())?.done).to.eql(true);
      },
    }, WORK);
    await rejected(call(() => source![Symbol.asyncIterator]()), 'sink-protocol');
    await rejected(iterator!.next(), 'sink-protocol');
    await rejected(call(() => iterator!.return?.()), 'sink-protocol');
  });

  it('timeout while the sink retains a paused inflater → revoke, join native work, observe late rejection', async () => {
    const archive = await Zip.open(
      Fixture.zip([{ name: 'a', data: new Uint8Array(BLOCK * 4), method: 8 }]).bytes,
      WORK,
    );
    let iterator: AsyncIterator<Uint8Array> | undefined;
    let rejectSink: ((cause: unknown) => void) | undefined;
    await rejected(
      archive.extractTo({
        async writeTree(entries) {
          iterator = files(entries)[0].content[Symbol.asyncIterator]();
          await iterator.next();
          await new Promise<void>((_resolve, reject) => {
            rejectSink = reject;
          });
        },
      }, { timeout: 100 }),
      'timeout',
    );
    expect(Is.func(rejectSink)).to.eql(true);
    rejectSink!(new Error('late sink failure'));
    await Schedule.tick();
    await rejected(iterator!.next(), 'timeout');
    await archive.extractTo(discard, WORK);
  });

  it('active cancellation → no later payload exposure and no failure replacement by the sink', async () => {
    for (const method of [0, 8] as const) {
      const archive = await Zip.open(
        Fixture.zip([{ name: 'a', data: new Uint8Array(BLOCK * 4), method }]).bytes,
        WORK,
      );
      const controller = new AbortController();
      await rejected(
        archive.extractTo({
          async writeTree(entries) {
            const iterator = files(entries)[0].content[Symbol.asyncIterator]();
            await iterator.next();
            const pending = iterator.next();
            controller.abort();
            await rejected(pending, 'cancelled');
            await rejected(iterator.next(), 'cancelled');
            throw new Error('must not replace cancellation');
          },
        }, { ...WORK, until: controller.signal }),
        'cancelled',
      );
      await archive.extractTo(discard, WORK);
    }
  });

  it('a non-preemptible sink prefix exhausts the deadline → timeout wins over its later exception', async () => {
    const archive = await Zip.open(Fixture.zip().bytes, WORK);
    let entered = false;
    await rejected(
      archive.extractTo({
        writeTree() {
          entered = true;
          const end = performance.now() + 100;
          // Deliberately starve timers in a bounded hostile synchronous prefix.
          while (performance.now() < end) { /* JavaScript cannot preempt this caller. */ }
          throw new Error('after the deadline');
        },
      }, { timeout: 50 }),
      'timeout',
    );
    expect(entered).to.eql(true);
  });

  it('slow demand → bounded chunks and complete consumption', async () => {
    const archive = await Zip.open(
      Fixture.zip([{ name: 'a', data: new Uint8Array(BLOCK * 4), method: 8 }]).bytes,
      WORK,
    );
    let count = 0;
    await archive.extractTo({
      async writeTree(entries) {
        for await (const bytes of files(entries)[0].content) {
          expect(bytes.byteLength).to.be.at.most(BLOCK);
          count++;
          await Time.wait(2);
        }
      },
    }, WORK);
    expect(count).to.eql(4);
  });
});
