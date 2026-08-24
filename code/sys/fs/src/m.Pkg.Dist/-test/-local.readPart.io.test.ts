import { describe, expect, Hash, it, Json, Num, StdPath } from '../../-test.ts';
import { Fs } from '../common.ts';
import { readLocalPartWithIo } from '../u.verify/u.pinned.part.ts';
import {
  DEFAULT_IO,
  expectIoPathsWithin,
  fixturePart,
  type IoCall,
  setup,
  teardown,
  traceIo,
  withIo,
} from './-u.pinned.fixture.ts';

describe('Pkg.Dist.Local.readPart IO invariants', () => {
  it('keeps submitted paths beneath the root and returns independently owned checksum-matched bytes', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const expected = await Deno.readFile(StdPath.join(part.dir, part.path));
      const calls: IoCall[] = [];
      const first = await readLocalPartWithIo(part, traceIo(calls));
      const second = await readLocalPartWithIo(part, traceIo(calls));

      expect(first).to.eql({ kind: 'read', bytes: expected });
      expect(second).to.eql({ kind: 'read', bytes: expected });
      if (first.kind !== 'read' || second.kind !== 'read') return;

      expect(first.bytes).to.not.equal(second.bytes);
      first.bytes[0] = first.bytes[0] ^ 0xff;
      expect(second.bytes).to.eql(expected);
      expect(calls.length).to.be.greaterThan(0);
      expectIoPathsWithin(calls, fixture.dir);
    } finally {
      await teardown(fixture);
    }
  });

  it('resolves caller spelling before requiring a canonical root', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const dir = StdPath.relative(Fs.cwd(), fixture.dir);
      const calls: IoCall[] = [];
      const result = await readLocalPartWithIo({ ...part, dir }, traceIo(calls));

      expect(result.kind).to.eql('read');
      expect(calls.length).to.be.greaterThan(0);
      expectIoPathsWithin(calls, fixture.dir);
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses incorrect size and checksum claims', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const wrongSize = await readLocalPartWithIo(
        { ...part, size: part.size + 1 },
        DEFAULT_IO,
      );
      const wrongChecksum = await readLocalPartWithIo(
        { ...part, checksum: Hash.sha256('wrong') },
        DEFAULT_IO,
      );

      expect(wrongSize).to.eql({ kind: 'content-mismatch' });
      expect(wrongChecksum).to.eql({ kind: 'content-mismatch' });
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels before IO and during an admitted read while closing its handle', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const before = new AbortController();
      before.abort('before');
      const calls: IoCall[] = [];
      const preCancelled = await readLocalPartWithIo(
        { ...part, until: before.signal },
        traceIo(calls),
      );
      expect(preCancelled).to.eql({ kind: 'cancelled' });
      expect(calls).to.eql([]);

      const during = new AbortController();
      const target = StdPath.join(part.dir, part.path);
      let closed = 0;
      const io = withIo({
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          if (path !== target) return handle;
          return {
            close: () => {
              closed += 1;
              handle.close();
            },
            stat: () => handle.stat(),
            read: async (buffer) => {
              const read = await handle.read(buffer.subarray(0, 1));
              during.abort('during');
              return read;
            },
          };
        },
      });
      const midCancelled = await readLocalPartWithIo(
        { ...part, until: during.signal },
        io,
      );
      expect(midCancelled).to.eql({ kind: 'cancelled' });
      expect(closed).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('detects selected-root replacement after canonicalization', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      let rootObservations = 0;
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          if (path !== fixture.dir || ++rootObservations < 3) return info;
          if (!Num.Is.safeInt(info.ino)) throw new Error('Expected stable fixture inode.');
          const ino = info.ino === Num.MAX_INT ? info.ino - 1 : info.ino + 1;
          return { ...info, ino };
        },
      });

      const result = await readLocalPartWithIo(part, io);
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('sanitizes host failures without exposing paths or causes', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const target = StdPath.join(part.dir, part.path);
      const io = withIo({
        open: async (path) => {
          if (path === target) throw new Error(`private path: ${path}`);
          return await DEFAULT_IO.open(path);
        },
      });

      const result = await readLocalPartWithIo(part, io);
      expect(result).to.eql({ kind: 'io-failure' });
      expect(Object.keys(result)).to.eql(['kind']);
      expect(Json.stringify(result).includes(fixture.dir)).to.eql(false);
      expect(Object.isFrozen(result)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});
