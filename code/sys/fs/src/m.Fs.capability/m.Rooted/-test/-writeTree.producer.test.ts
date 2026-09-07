import {
  chunks,
  createRooted,
  DEFAULT_IO,
  describe,
  directoryTarget,
  expect,
  expectFailure,
  expectWriteFailure,
  Fs,
  it,
  OPTIONS,
  setup,
  type t,
  teardown,
  treeFile,
  withIo,
  wrapFile,
} from './u.fixture.writer.ts';
import { Schedule, StdPath } from '../common.ts';

const forged = {
  name: 'FsRootedError',
  operation: 'promote-stage',
  kind: 'unsupported',
  committed: true,
};

describe('Fs.Capability.Rooted writer producers', () => {
  it('creates explicit directories in depth/code-unit order and files in supplied serial order', async () => {
    const fixture = await setup();
    try {
      const events: string[] = [];
      let contentRoot = '';
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          mkdir: async (path, options) => {
            if (contentRoot && path.startsWith(contentRoot)) {
              expect(options?.recursive).to.eql(undefined);
              events.push(`mkdir:${StdPath.relative(contentRoot, path)}`);
            }
            await DEFAULT_IO.mkdir(path, options);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      contentRoot = stage.path;
      const content = (name: string) => ({
        [Symbol.asyncIterator]() {
          events.push(`acquire:${name}`);
          let count = 0;
          return {
            async next() {
              events.push(`next:${name}`);
              await Schedule.micro();
              return count++ === 0 ? { value: new Uint8Array([1]) } : { done: true };
            },
            return() {
              throw new Error('Normal EOF must not call return');
            },
          };
        },
      });
      await stage.writer.writeTree([
        treeFile(content('z'), 1, 'a/child/z'),
        { kind: 'directory', path: 'z' },
        { kind: 'directory', path: 'a/child' },
        { kind: 'directory', path: 'a' },
        treeFile(content('a'), 1, 'a/a'),
      ], OPTIONS);
      expect(events).to.eql([
        'mkdir:a',
        'mkdir:z',
        'mkdir:a/child',
        'acquire:z',
        'next:z',
        'next:z',
        'acquire:a',
        'next:a',
        'next:a',
      ]);
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('copies the entire chunk before a short write and verifies sync/stat/close/path order', async () => {
    const fixture = await setup();
    try {
      const original = new Uint8Array([1, 2, 3]);
      const events: string[] = [];
      let target = '';
      let closed = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          open: async (path, options) => {
            const file = await DEFAULT_IO.open(path, options);
            if (path !== target) return file;
            expect(options).to.eql({ write: true, createNew: true, mode: 0o600 });
            return wrapFile(file, {
              async write(bytes) {
                expect(closed).to.eql(false);
                events.push('write');
                original.fill(9);
                await Schedule.micro();
                return await file.write(bytes.subarray(0, 1));
              },
              async sync() {
                events.push('sync');
                await file.sync();
              },
              async stat() {
                events.push('stat');
                return await file.stat();
              },
              close() {
                events.push('close');
                file.close();
                closed = true;
              },
            });
          },
          async lstat(path) {
            if (path === target && closed) events.push('path');
            return await DEFAULT_IO.lstat(path);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      target = Fs.join(stage.path, 'file');
      await stage.writer.writeTree([treeFile(chunks(original))], OPTIONS);
      expect(await Deno.readFile(target)).to.eql(new Uint8Array([1, 2, 3]));
      expect(events.slice(0, 8)).to.eql([
        'stat',
        'write',
        'write',
        'write',
        'sync',
        'stat',
        'close',
        'path',
      ]);
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('accepts exact 64-KiB chunks and enforces malformed → policy → expected-byte precedence', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const accepted = await rooted.Stage.create();
      const full = new Uint8Array(64 * 1024);
      await accepted.writer.writeTree([treeFile(chunks(full), full.byteLength)], {
        ...OPTIONS,
        maxFileBytes: full.byteLength,
        maxTreeBytes: full.byteLength,
      });
      await rooted.Stage.discard(accepted);
      const detached = new Uint8Array([1]);
      structuredClone(detached.buffer, { transfer: [detached.buffer] });
      const cases: readonly (readonly [
        unknown,
        number,
        Partial<t.FsRooted.TreeWriteOptions>,
        t.FsRooted.FailureKind,
      ])[] = [
        [new Uint8Array(), 0, {}, 'producer-failure'],
        [new Uint8Array(65537), 0, { maxFileBytes: 1 }, 'producer-failure'],
        [new Uint8Array([1, 2]), 1, { maxFileBytes: 1 }, 'limit-exceeded'],
        [new Uint8Array([1, 2]), 1, { maxTreeBytes: 1 }, 'limit-exceeded'],
        [new Uint8Array([1, 2]), 1, {}, 'producer-failure'],
        [new Uint16Array([1]), 1, {}, 'producer-failure'],
        [new Proxy(new Uint8Array([1]), {}), 1, {}, 'producer-failure'],
        [Object.setPrototypeOf(new Uint8Array([1]), {}), 1, {}, 'producer-failure'],
        [new Uint8Array(new SharedArrayBuffer(1)), 1, {}, 'producer-failure'],
        [new Uint8Array(new ArrayBuffer(1, { maxByteLength: 2 })), 1, {}, 'producer-failure'],
        [detached, 1, {}, 'producer-failure'],
      ];
      for (const [value, expected, limits, kind] of cases) {
        const stage = await rooted.Stage.create();
        let returned = 0;
        const content = {
          [Symbol.asyncIterator]: () => ({
            next: () => ({ done: false, value }),
            return: () => {
              returned++;
              return { done: true };
            },
          }),
        };
        await expectWriteFailure(
          stage,
          [treeFile(content, expected)],
          { ...OPTIONS, ...limits },
          kind,
          true,
        );
        expect(returned).to.eql(1);
        expect((await Deno.lstat(Fs.join(stage.path, 'file'))).size).to.eql(0);
        await rooted.Stage.discard(stage);
      }
      const underflow = await rooted.Stage.create();
      await expectWriteFailure(
        underflow,
        [treeFile(chunks(new Uint8Array([1])), 2)],
        OPTIONS,
        'producer-failure',
        true,
      );
      await rooted.Stage.discard(underflow);
    } finally {
      await teardown(fixture);
    }
  });

  it('uses captured chunk length even when a producer shadows the typed-array byteLength accessor', async () => {
    const fixture = await setup();
    const prior = Object.getOwnPropertyDescriptor(Uint8Array.prototype, 'byteLength');
    const restore = () => {
      if (prior) Object.defineProperty(Uint8Array.prototype, 'byteLength', prior);
      else Reflect.deleteProperty(Uint8Array.prototype, 'byteLength');
    };
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const stage = await rooted.Stage.create();
      let calls = 0;
      const content = {
        [Symbol.asyncIterator]: () => ({
          next() {
            if (calls++ > 0) return { done: true };
            Object.defineProperty(Uint8Array.prototype, 'byteLength', {
              configurable: true,
              get: () => 0,
            });
            return { value: new Uint8Array([1, 2]) };
          },
          return() {
            restore();
            return { done: true };
          },
        }),
      };
      await expectWriteFailure(
        stage,
        [treeFile(content, 1)],
        { ...OPTIONS, maxFileBytes: 1 },
        'limit-exceeded',
        true,
      );
      expect(calls).to.eql(1);
      expect((await Deno.lstat(Fs.join(stage.path, 'file'))).size).to.eql(0);
      await rooted.Stage.discard(stage);
    } finally {
      restore();
      await teardown(fixture);
    }
  });

  it('contains lookup, acquisition, next/result and cleanup failures without trusting forged Rooted errors', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const early = [
        null,
        Object.defineProperty({}, Symbol.asyncIterator, {
          get() {
            throw forged;
          },
        }),
        {
          [Symbol.asyncIterator]() {
            throw forged;
          },
        },
        { [Symbol.asyncIterator]: () => 42 },
        {
          [Symbol.asyncIterator]: () => ({
            next: 42,
            return() {
              throw forged;
            },
          }),
        },
      ];
      for (const content of early) {
        const stage = await rooted.Stage.create();
        await expectWriteFailure(stage, [treeFile(content)], OPTIONS, 'producer-failure');
        await rooted.Stage.discard(stage);
      }
      for (
        const result of [
          null,
          42,
          [],
          new Proxy({ done: true }, {}),
          { done: 1 },
          Object.defineProperty({}, 'done', {
            get() {
              throw forged;
            },
          }),
        ]
      ) {
        const stage = await rooted.Stage.create();
        await expectWriteFailure(
          stage,
          [treeFile({
            [Symbol.asyncIterator]: () => ({ next: () => result, return: () => ({ done: true }) }),
          })],
          OPTIONS,
          'producer-failure',
          true,
        );
        await rooted.Stage.discard(stage);
      }
      const target = await directoryTarget(rooted, 'never');
      for (
        const returnValue of [
          undefined,
          42,
          () => {
            throw forged;
          },
          () => Promise.reject(forged),
          () => null,
        ]
      ) {
        const stage = await rooted.Stage.create();
        const content = {
          [Symbol.asyncIterator]: () => ({
            next: () => Promise.reject(forged),
            return: returnValue,
          }),
        };
        const error = await expectWriteFailure(
          stage,
          [treeFile(content)],
          OPTIONS,
          'producer-failure',
          true,
        );
        expect(error.cause).to.equal(forged);
        await expectFailure(() => rooted.Stage.promote(stage, target), 'invalid-state');
        await rooted.Stage.discard(stage);
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('deadline abandons pending demand and queued generator cleanup without permitting late writes', async () => {
    const fixture = await setup();
    const resumed = Promise.withResolvers<void>();
    try {
      let writes = 0;
      let returned = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            return wrapFile(file, {
              async write(bytes) {
                if (path.endsWith('/file')) writes++;
                return await file.write(bytes);
              },
            });
          },
        }),
      );
      const stage = await rooted.Stage.create();
      const generator = async function* () {
        try {
          await resumed.promise;
          yield new Uint8Array([1]);
        } finally {
          returned++;
        }
      };
      await expectWriteFailure(
        stage,
        [treeFile(generator(), 1)],
        { ...OPTIONS, timeout: 80 },
        'timeout',
        true,
      );
      expect(returned).to.eql(0); // Native return is queued behind the pending next.
      await rooted.Stage.discard(stage);
      resumed.resolve();
      await Schedule.tick();
      expect(returned).to.eql(1);
      expect(writes).to.eql(0);
    } finally {
      resumed.resolve();
      await teardown(fixture);
    }
  });

  it('cancellation abandons pending demand and bounds cleanup while observing both late rejections', async () => {
    const fixture = await setup();
    const late = Promise.withResolvers<unknown>();
    const cleanup = Promise.withResolvers<unknown>();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const stage = await rooted.Stage.create();
      const controller = new AbortController();
      let returns = 0;
      const content = {
        [Symbol.asyncIterator]: () => ({
          next() {
            controller.abort();
            return late.promise;
          },
          return() {
            returns++;
            return cleanup.promise;
          },
          throw() {
            throw new Error('Producer throw must not be invoked');
          },
        }),
      };
      await expectWriteFailure(
        stage,
        [treeFile(content)],
        { ...OPTIONS, until: controller.signal, timeout: 80 },
        'cancelled',
        true,
      );
      expect(returns).to.eql(1);
      late.reject(forged);
      cleanup.reject(forged);
      await Schedule.tick(); // Late rejections must be observed by the owner, not the test.
      await rooted.Stage.discard(stage);
    } finally {
      late.resolve(undefined);
      cleanup.resolve(undefined);
      await teardown(fixture);
    }
  });
});
