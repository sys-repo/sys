import { crc32, deflateRawSync } from 'node:zlib';
import { Hash } from '@sys/crypto/hash';
import { describe, Dispose, expect, it, type t } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { copySource, DEFAULT_LIMITS } from '../u/u.input.ts';
import {
  clone,
  extra,
  PINNED_DEFLATE_SHA256,
  PINNED_DEFLATE_TEXT,
  pinnedDeflateBytes,
  setU16,
  setU32,
  zip,
} from './u.fixture.ts';

const LIMITS: t.Zip.Limits = Object.freeze({
  maxSourceBytes: 2 * 1024 * 1024,
  maxEntries: 2048,
  maxTreeEntries: 8192,
  maxPathBytes: 512,
  maxPathDepth: 32,
  maxEntryBytes: 1024 * 1024,
  maxExpandedBytes: 2 * 1024 * 1024,
  maxErrorChars: 1000,
});

const options = (limits: t.Zip.Limits = LIMITS): t.Zip.OpenOptions => ({
  limits,
  timeout: 10_000,
});

/** Assert the complete public failure contract shared by hostile-input cases. */
async function rejected(
  promise: Promise<unknown>,
  kind: t.Zip.Failure.Kind,
  operation: t.Zip.Operation = 'open',
): Promise<t.Zip.Failure.Error> {
  try {
    await promise;
  } catch (error) {
    expect(Zip.Is.failure(error)).to.eql(true);
    const failure = error as t.Zip.Failure.Error;
    expect(failure.operation).to.eql(operation);
    expect(failure.kind).to.eql(kind);
    expect(Object.isFrozen(failure)).to.eql(true);
    return failure;
  }
  throw new Error(`Expected ${operation}/${kind} rejection`);
}

/** Compile and execute through only the public cross-package consumer contract. */
async function consumeThroughPublicContract(
  lib: t.Zip.Lib,
  bytes: Uint8Array,
  openOptions: t.Zip.OpenOptions,
  testOptions: t.Zip.WorkOptions,
): Promise<t.Zip.TestResult> {
  const archive: t.Zip.Archive = await lib.open(bytes, openOptions);
  const inspection: t.Zip.Inspection = archive.inspect();
  if (inspection.format !== 'zip32') throw new Error('Unexpected archive format');
  return await archive.test(testOptions);
}

/** Assert synchronous failures from internal pre-allocation test seams. */
function rejectedSync(
  fn: () => unknown,
  kind: t.Zip.Failure.Kind,
): t.Zip.Failure.Error {
  try {
    fn();
  } catch (error) {
    expect(Zip.Is.failure(error)).to.eql(true);
    const failure = error as t.Zip.Failure.Error;
    expect(failure.kind).to.eql(kind);
    return failure;
  }
  throw new Error(`Expected synchronous ${kind} rejection`);
}

describe('@sys/archive/zip: read-only API', () => {
  describe('archive surface', () => {
    it('returns complete frozen evidence for an empty archive', async () => {
      const fixture = zip();
      const archive = await Zip.open(fixture.bytes, options());
      const inspection = archive.inspect();

      expect(inspection).to.eql({
        format: 'zip32',
        sourceBytes: 22,
        fileCount: 0,
        directoryCount: 0,
        treeEntryCount: 0,
        compressedBytes: 0,
        expandedBytes: 0,
        usage: {
          storedEntries: 0,
          deflatedEntries: 0,
          utf8Entries: 0,
          descriptorEntries: 0,
        },
        entries: [],
      });
      expect(archive.inspect()).to.equal(inspection);
      const tested = await archive.test({ timeout: 10_000 });
      expect(tested).to.eql({
        kind: 'passed',
        filesTested: 0,
        compressedBytes: 0,
        expandedBytes: 0,
      });
      expect(Object.isFrozen(tested)).to.eql(true);
      expect(Object.isFrozen(archive)).to.eql(true);
      expect(Object.isFrozen(inspection)).to.eql(true);
      expect(Object.isFrozen(inspection.usage)).to.eql(true);
      expect(Object.isFrozen(inspection.entries)).to.eql(true);
    });

    it('merges partial limit overrides into finite defaults', async () => {
      expect(DEFAULT_LIMITS).to.eql({
        maxSourceBytes: 64 * 1024 * 1024,
        maxEntries: 2048,
        maxTreeEntries: 8192,
        maxPathBytes: 512,
        maxPathDepth: 32,
        maxEntryBytes: 128 * 1024 * 1024,
        maxExpandedBytes: 512 * 1024 * 1024,
        maxErrorChars: 16_000,
      });
      expect(Object.isFrozen(DEFAULT_LIMITS)).to.eql(true);

      expect((await Zip.open(zip().bytes, { timeout: 10_000 })).inspect().format).to.eql('zip32');
      expect(
        (await Zip.open(zip().bytes, { timeout: 10_000, limits: {} })).inspect().format,
      ).to.eql('zip32');
      expect(
        (await Zip.open(zip().bytes, {
          timeout: 10_000,
          limits: { maxSourceBytes: 22 },
        })).inspect().sourceBytes,
      ).to.eql(22);
      await rejected(
        Zip.open(zip().bytes, { timeout: 10_000, limits: { maxSourceBytes: 21 } }),
        'source-limit',
      );
    });

    it('reports exact entry, tree, and feature-use metadata', async () => {
      const fixture = zip([
        { name: 'root/', utf8: false },
        { name: 'root/stored.txt', data: 'stored', utf8: false },
        { name: 'deep/path/value.txt', data: 'deflated value', method: 8 },
        { name: 'descriptor.bin', data: 'descriptor', method: 8, descriptor: 'signed' },
      ]);
      const archive = await Zip.open(fixture.bytes, options());
      const inspection = archive.inspect();

      expect(inspection.fileCount).to.eql(3);
      expect(inspection.directoryCount).to.eql(1);
      expect(inspection.treeEntryCount).to.eql(6);
      expect(inspection.usage).to.eql({
        storedEntries: 2,
        deflatedEntries: 2,
        utf8Entries: 2,
        descriptorEntries: 1,
      });
      expect(inspection.entries.map((entry) => entry.compression)).to.eql([
        'stored',
        'stored',
        'deflate',
        'deflate',
      ]);
      expect(inspection.entries.map((entry) => entry.deflateOption)).to.eql([
        'none',
        'none',
        'normal',
        'normal',
      ]);
      expect(inspection.entries.every(Object.isFrozen)).to.eql(true);
      expect(await archive.test({ timeout: 10_000 })).to.eql({
        kind: 'passed',
        filesTested: 3,
        compressedBytes: inspection.entries
          .filter((entry) => entry.kind === 'file')
          .reduce((sum, entry) => sum + entry.compressedBytes, 0),
        expandedBytes: 'stored'.length + 'deflated value'.length + 'descriptor'.length,
      });
    });

    it('admits signed and unsigned ZIP32 data descriptors', async () => {
      for (const descriptor of ['signed', 'unsigned'] as const) {
        const archive = await Zip.open(
          zip([{ name: `${descriptor}.txt`, data: descriptor, descriptor }]).bytes,
          options(),
        );
        expect(archive.inspect().entries[0].dataDescriptor).to.eql(true);
        expect((await archive.test({ timeout: 10_000 })).kind).to.eql('passed');
      }
    });

    it('admits maximum-length opaque comments without exposing them', async () => {
      const ordinary = await Zip.open(
        zip([{ name: 'ordinary.txt', comment: new Uint8Array([1, 2, 3]) }], {
          comment: new Uint8Array([4, 5, 6]),
        }).bytes,
        options(),
      );
      expect((await ordinary.test({ timeout: 10_000 })).kind).to.eql('passed');

      const archiveComment = new Uint8Array(0xffff);
      archiveComment.fill(0x61);
      const centralComment = new Uint8Array(0xffff);
      centralComment.fill(0x62);
      const fixture = zip(
        [{ name: 'commented.txt', data: 'value', comment: centralComment }],
        { comment: archiveComment },
      );
      const archive = await Zip.open(fixture.bytes, options());
      const inspection = archive.inspect();
      expect(Object.keys(inspection.entries[0])).to.eql([
        'index',
        'path',
        'kind',
        'creatorSystem',
        'compression',
        'deflateOption',
        'utf8',
        'dataDescriptor',
        'crc32',
        'compressedBytes',
        'expandedBytes',
        'localHeaderOffset',
      ]);
      expect(JSON.stringify(inspection)).not.to.contain('aaaa');
      expect(JSON.stringify(inspection)).not.to.contain('bbbb');
      expect((await archive.test({ timeout: 10_000 })).kind).to.eql('passed');
    });
  });

  describe('source ownership and admission', () => {
    it('retains an immutable byte snapshot after caller mutation', async () => {
      const fixture = zip([{ name: 'safe.txt', data: 'safe', utf8: false }]);
      const source = fixture.bytes.slice();
      const archive = await Zip.open(source, options());
      source.fill(0);
      expect(archive.inspect().entries[0].path).to.eql('safe.txt');
      expect((await archive.test({ timeout: 10_000 })).kind).to.eql('passed');
    });

    it('reads native input through captured intrinsics instead of shadowed properties', async () => {
      const source = zip().bytes;
      for (const key of ['buffer', 'byteLength', 'constructor'] as const) {
        Object.defineProperty(source, key, {
          configurable: true,
          get: () => {
            throw new Error(`shadowed ${key} was invoked`);
          },
        });
      }
      Object.defineProperty(source, Symbol.iterator, {
        configurable: true,
        value: () => {
          throw new Error('shadowed iterator was invoked');
        },
      });
      expect((await Zip.open(source, options())).inspect().format).to.eql('zip32');
    });

    it('rejects proxies, subclasses, detached, shared, and resizable backing stores', async () => {
      const fixture = zip().bytes;
      await rejected(Zip.open(new Proxy(fixture, {}) as Uint8Array, options()), 'invalid-input');

      class Bytes extends Uint8Array {}
      await rejected(Zip.open(new Bytes(fixture), options()), 'invalid-input');

      const detached = fixture.slice();
      structuredClone(detached.buffer, { transfer: [detached.buffer] });
      await rejected(Zip.open(detached, options()), 'invalid-input');

      const shared = new Uint8Array(new SharedArrayBuffer(fixture.byteLength));
      shared.set(fixture);
      await rejected(Zip.open(shared, options()), 'invalid-input');
      let allocated = false;
      rejectedSync(
        () =>
          copySource(shared, LIMITS, (length) => {
            allocated = true;
            return new Uint8Array(length);
          }),
        'invalid-input',
      );
      expect(allocated).to.eql(false);

      const growable = new Uint8Array(
        new SharedArrayBuffer(fixture.byteLength, { maxByteLength: fixture.byteLength + 1024 }),
      );
      growable.set(fixture);
      await rejected(Zip.open(growable, options()), 'invalid-input');

      const resizable = new Uint8Array(
        new ArrayBuffer(fixture.byteLength, { maxByteLength: fixture.byteLength + 1024 }),
      );
      resizable.set(fixture);
      await rejected(Zip.open(resizable, options()), 'invalid-input');
    });

    it('enforces source ownership and size caps before allocation', async () => {
      const exact = Object.freeze({ ...LIMITS, maxSourceBytes: 22 });
      expect((await Zip.open(zip().bytes, options(exact))).inspect().sourceBytes).to.eql(22);
      const tiny = Object.freeze({ ...LIMITS, maxSourceBytes: 21 });
      await rejected(Zip.open(zip().bytes, options(tiny)), 'source-limit');

      let allocated = false;
      rejectedSync(
        () =>
          copySource(new Uint8Array(2), { ...LIMITS, maxSourceBytes: 1 }, () => {
            allocated = true;
            return new Uint8Array(2);
          }),
        'source-limit',
      );
      expect(allocated).to.eql(false);

      rejectedSync(
        () =>
          copySource(
            new Uint8Array(2),
            LIMITS,
            (length) => new Uint8Array(new ArrayBuffer(length, { maxByteLength: length + 1 })),
          ),
        'invalid-input',
      );
      rejectedSync(
        () =>
          copySource(
            new Uint8Array(2),
            LIMITS,
            (length) => new Uint8Array(new ArrayBuffer(length + 1), 0, length),
          ),
        'invalid-input',
      );
    });
  });

  describe('options and lifecycle', () => {
    it('snapshots exact mutable options without invoking accessors', async () => {
      await rejected(
        Zip.open(zip().bytes, { ...options(), unknown: true } as t.Zip.OpenOptions),
        'invalid-options',
      );
      await rejected(
        Zip.open(zip().bytes, { timeout: 10_000, limits: { maxEntries: 0 } }),
        'invalid-options',
      );

      let invoked = false;
      const accessor = { timeout: 10_000 } as Record<string, unknown>;
      Object.defineProperty(accessor, 'limits', {
        enumerable: true,
        get: () => {
          invoked = true;
          return LIMITS;
        },
      });
      await rejected(Zip.open(zip().bytes, accessor as t.Zip.OpenOptions), 'invalid-options');
      expect(invoked).to.eql(false);

      const mutableLimits: t.Zip.Limits = { ...LIMITS };
      const mutableOptions: t.Zip.OpenOptions = { limits: mutableLimits, timeout: 10_000 };
      const pending = Zip.open(zip().bytes, mutableOptions);
      mutableOptions.timeout = -1;
      mutableOptions.limits = { maxSourceBytes: 1 };
      mutableLimits.maxSourceBytes = 1;
      expect((await pending).inspect().format).to.eql('zip32');

      const signal = new AbortController().signal;
      await rejected(
        Zip.open(zip().bytes, {
          ...options(),
          until: Array.from({ length: 256 }, () => signal),
        }),
        'invalid-options',
      );
      let nested: t.UntilInput = signal;
      for (let index = 0; index < 33; index++) nested = [nested];
      await rejected(
        Zip.open(zip().bytes, { ...options(), until: nested }),
        'invalid-options',
      );

      const archive = await Zip.open(zip().bytes, options());
      const workFailure = await rejected(
        archive.test({ timeout: -1 }),
        'invalid-options',
        'test',
      );
      expect(workFailure.operation).to.eql('test');
    });

    it('settles pre-terminal lifecycles and disposes subscriptions', async () => {
      const controller = new AbortController();
      controller.abort('stop');
      await rejected(
        Zip.open(zip().bytes, { ...options(), until: controller.signal }),
        'cancelled',
      );
      await rejected(Zip.open(zip().bytes, { ...options(), timeout: 0 }), 'timeout');

      let synchronousUnsubscribed = false;
      const synchronous = {
        subscribe(next: (value: unknown) => void) {
          next(undefined);
          return {
            closed: false,
            unsubscribe() {
              synchronousUnsubscribed = true;
            },
          };
        },
      };
      await rejected(
        Zip.open(zip().bytes, { ...options(), until: synchronous as t.UntilInput }),
        'cancelled',
      );
      expect(synchronousUnsubscribed).to.eql(true);

      const life = Dispose.lifecycle();
      life.dispose();
      await rejected(
        Zip.open(zip().bytes, { ...options(), until: [undefined, [life]] }),
        'cancelled',
      );

      let completedUnsubscribed = false;
      const never = {
        subscribe() {
          return {
            closed: false,
            unsubscribe() {
              completedUnsubscribed = true;
            },
          };
        },
      };
      const completed = await Zip.open(zip().bytes, {
        ...options(),
        until: never as t.UntilInput,
      });
      expect(completedUnsubscribed).to.eql(true);
      completedUnsubscribed = false;
      await completed.test({ timeout: 10_000, until: never as t.UntilInput });
      expect(completedUnsubscribed).to.eql(true);
    });
  });

  describe('failures and consumer surface', () => {
    it('authenticates frozen failures without traversing lookalikes or proxies', async () => {
      const failure = await rejected(Zip.open(new Uint8Array(), options()), 'malformed');
      expect(Object.keys(failure)).to.eql(['name', 'operation', 'kind']);
      expect(Zip.Is.failure({ name: 'ZipError', operation: 'open', kind: 'malformed' })).to.eql(
        false,
      );
      let trapped = false;
      const proxy = new Proxy({}, {
        get() {
          trapped = true;
          throw new Error('trap');
        },
      });
      expect(Zip.Is.failure(proxy)).to.eql(false);
      expect(trapped).to.eql(false);
    });

    it('caps malformed and option-failure messages with admitted policy', async () => {
      const limits = Object.freeze({ ...LIMITS, maxErrorChars: 5 });
      const failure = await rejected(Zip.open(new Uint8Array(), options(limits)), 'malformed');
      expect(failure.message.length).to.be.at.most(5);
      const invalid = await rejected(
        Zip.open(zip().bytes, { limits, timeout: -1 }),
        'invalid-options',
      );
      expect(invalid.message.length).to.be.at.most(5);

      const invalidSibling = await rejected(
        Zip.open(zip().bytes, {
          timeout: 10_000,
          limits: { maxEntries: 0, maxErrorChars: 5 },
        }),
        'invalid-options',
      );
      expect(invalidSibling.message.length).to.be.at.most(5);

      const unknownSibling = await rejected(
        Zip.open(zip().bytes, {
          timeout: 10_000,
          limits: { maxErrorChars: 5 },
          unknown: true,
        } as t.Zip.OpenOptions),
        'invalid-options',
      );
      expect(unknownSibling.message.length).to.be.at.most(5);
    });

    it('supports the exact frozen consumer contract without adaptation', async () => {
      expect(
        await consumeThroughPublicContract(
          Zip,
          zip().bytes,
          { timeout: 10_000 },
          { timeout: 10_000 },
        ),
      ).to.eql({ kind: 'passed', filesTested: 0, compressedBytes: 0, expandedBytes: 0 });
      expect(Object.keys(Zip)).to.eql(['Is', 'open']);
      expect(Object.keys(Zip.Is)).to.eql(['failure']);
      expect(Object.isFrozen(Zip)).to.eql(true);
      expect(Object.isFrozen(Zip.Is)).to.eql(true);
    });
  });
});

describe('@sys/archive/zip: ZIP32 grammar and integrity', () => {
  describe('checksum and fixture provenance', () => {
    it('matches the canonical ZIP CRC-32 vector whole and incrementally', async () => {
      const data = new TextEncoder().encode('123456789');
      const expected = 0xcbf43926;
      expect(crc32(data) >>> 0).to.eql(expected);
      for (let split = 0; split <= data.byteLength; split++) {
        const first = crc32(data.subarray(0, split)) >>> 0;
        expect(crc32(data.subarray(split), first) >>> 0).to.eql(expected);
      }
      const archive = await Zip.open(
        zip([{ name: 'crc-vector.txt', data, crc32: expected }]).bytes,
        options(),
      );
      expect((await archive.test({ timeout: 10_000 })).kind).to.eql('passed');
    });

    it('verifies the pinned Deno 2.9.6 raw-DEFLATE bytes and checksum', async () => {
      const data = new TextEncoder().encode(PINNED_DEFLATE_TEXT);
      const compressed = pinnedDeflateBytes();
      expect(new Uint8Array(deflateRawSync(data))).to.eql(compressed);
      expect(Hash.sha256(compressed)).to.eql(PINNED_DEFLATE_SHA256);
      const archive = await Zip.open(
        zip([{ name: 'pinned.txt', data, method: 8, compressed }]).bytes,
        options(),
      );
      expect((await archive.test({ timeout: 10_000 })).kind).to.eql('passed');
    });
  });

  describe('record grammar and entry metadata', () => {
    it('rejects non-contiguous, truncated, ambiguous, and contradictory records', async () => {
      const fixture = zip([{ name: 'value.txt', data: 'value' }]);
      const trailing = new Uint8Array(fixture.bytes.byteLength + 1);
      trailing.set(fixture.bytes);
      await rejected(Zip.open(trailing, options()), 'malformed');

      const prepended = new Uint8Array(fixture.bytes.byteLength + 1);
      prepended.set(fixture.bytes, 1);
      await rejected(Zip.open(prepended, options()), 'malformed');
      await rejected(Zip.open(fixture.bytes.slice(0, -1), options()), 'malformed');

      const centralSignature = clone(fixture.bytes);
      setU32(centralSignature, fixture.centralOffset, 0);
      await rejected(Zip.open(centralSignature, options()), 'malformed');

      const localName = clone(fixture.bytes);
      localName[30] ^= 1;
      await rejected(Zip.open(localName, options()), 'malformed');

      const fakeEocd = zip().bytes;
      setU32(fakeEocd, 16, 22);
      const ambiguous = zip([], { comment: fakeEocd });
      await rejected(Zip.open(ambiguous.bytes, options()), 'malformed');

      const badCommentLength = clone(zip().bytes);
      setU16(badCommentLength, 20, 1);
      await rejected(Zip.open(badCommentLength, options()), 'malformed');

      const centralCommentOverrun = clone(fixture.bytes);
      setU16(centralCommentOverrun, fixture.centralOffset + 32, 1);
      await rejected(Zip.open(centralCommentOverrun, options()), 'malformed');

      const descriptor = zip([{ name: 'd', data: 'x', descriptor: 'signed' }]);
      const badDescriptor = clone(descriptor.bytes);
      setU32(badDescriptor, descriptor.centralOffset - 12, 0);
      await rejected(Zip.open(badDescriptor, options()), 'malformed');

      const nonzeroPlaceholder = clone(descriptor.bytes);
      setU32(nonzeroPlaceholder, 14, 1);
      await rejected(Zip.open(nonzeroPlaceholder, options()), 'malformed');

      const unequalStored = zip([{
        name: 'unequal-stored',
        data: '12345',
        compressed: new Uint8Array([1, 2, 3, 4]),
      }]);
      await rejected(Zip.open(unequalStored.bytes, options()), 'malformed');
    });

    it('rejects split, ZIP64, encrypted, unknown-method, and unknown-creator features', async () => {
      const base = zip([{ name: 'value.txt', data: 'value' }]);
      const cases: Uint8Array[] = [];

      const split = clone(base.bytes);
      setU16(split, base.eocdOffset + 4, 1);
      cases.push(split);

      const splitCount = clone(base.bytes);
      setU16(splitCount, base.eocdOffset + 8, 0);
      cases.push(splitCount);

      const zip64 = clone(base.bytes);
      setU32(zip64, base.centralOffset + 20, 0xffffffff);
      cases.push(zip64);

      const encrypted = clone(base.bytes);
      setU16(encrypted, base.centralOffset + 8, 0x0801);
      setU16(encrypted, 6, 0x0801);
      cases.push(encrypted);

      const method = clone(base.bytes);
      setU16(method, base.centralOffset + 10, 99);
      setU16(method, 8, 99);
      cases.push(method);

      const creator = clone(base.bytes);
      setU16(creator, base.centralOffset + 4, (9 << 8) | 20);
      cases.push(creator);

      for (const bytes of cases) await rejected(Zip.open(bytes, options()), 'unsupported');
    });

    it('admits only supported version-needed and DEFLATE-option combinations', async () => {
      expect(
        (await Zip.open(zip([{ name: 'stored', versionNeeded: 20 }]).bytes, options())).inspect()
          .entries[0].compression,
      ).to.eql('stored');
      await rejected(
        Zip.open(zip([{ name: 'deflated', method: 8, versionNeeded: 10 }]).bytes, options()),
        'unsupported',
      );

      for (
        const [bits, expected] of [
          [0, 'normal'],
          [0x0002, 'maximum'],
          [0x0004, 'fast'],
          [0x0006, 'super-fast'],
        ] as const
      ) {
        const fixture = zip([{ name: `${expected}.txt`, data: expected, method: 8 }]);
        setU16(fixture.bytes, 6, 0x0800 | bits);
        setU16(fixture.bytes, fixture.centralOffset + 8, 0x0800 | bits);
        const entry = (await Zip.open(fixture.bytes, options())).inspect().entries[0];
        expect(entry.deflateOption).to.eql(expected);
      }
    });

    it('accepts only the bounded 0x5455 and 0x7875 extra-field grammars', async () => {
      const timestamp = extra(0x5455, new Uint8Array([1, 1, 0, 0, 0]));
      const unixIdentity = extra(0x7875, new Uint8Array([1, 1, 42, 1, 43]));
      const archive = await Zip.open(
        zip([{
          name: 'extras.txt',
          data: 'extras',
          localExtra: timestamp,
          centralExtra: unixIdentity,
        }]).bytes,
        options(),
      );
      expect((await archive.test({ timeout: 10_000 })).kind).to.eql('passed');

      const localTimes = extra(
        0x5455,
        new Uint8Array([7, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]),
      );
      const centralTimes = extra(0x5455, new Uint8Array([0]));
      const wideIdentity = extra(
        0x7875,
        new Uint8Array([1, 8, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 7, 6, 5, 4, 3, 2, 1]),
      );
      const boundaryArchive = await Zip.open(
        zip([{
          name: 'extra-boundaries',
          localExtra: new Uint8Array([...localTimes, ...wideIdentity]),
          centralExtra: new Uint8Array([...centralTimes, ...wideIdentity]),
        }]).bytes,
        options(),
      );
      expect(boundaryArchive.inspect().fileCount).to.eql(1);

      for (const id of [0x000d, 0x0001, 0x0017, 0x6375, 0x7075, 0x9901]) {
        await rejected(
          Zip.open(
            zip([{ name: `unsupported-${id}`, centralExtra: extra(id, new Uint8Array([1])) }])
              .bytes,
            options(),
          ),
          'unsupported',
        );
      }
      await rejected(
        Zip.open(
          zip([{
            name: 'duplicate',
            centralExtra: new Uint8Array([...timestamp, ...timestamp]),
          }]).bytes,
          options(),
        ),
        'malformed',
      );
      await rejected(
        Zip.open(
          zip([{ name: 'bad-time', centralExtra: extra(0x5455, new Uint8Array([2])) }]).bytes,
          options(),
        ),
        'malformed',
      );
    });

    it('accepts only ordinary DOS and Info-ZIP Unix entry types', async () => {
      const regular = (0o100644 << 16) >>> 0;
      const directory = ((0o040755 << 16) | 0x10) >>> 0;
      const archive = await Zip.open(
        zip([
          { name: 'unix.txt', creator: 3, attributes: regular },
          { name: 'unix-dir/', creator: 3, attributes: directory },
        ]).bytes,
        options(),
      );
      expect(archive.inspect().entries.map((entry) => entry.kind)).to.eql(['file', 'directory']);

      for (const type of [0o010000, 0o020000, 0o060000, 0o120000, 0o140000, 0o160000]) {
        const attributes = ((type | 0o777) << 16) >>> 0;
        await rejected(
          Zip.open(zip([{ name: `special-${type}`, creator: 3, attributes }]).bytes, options()),
          'unsupported',
        );
        await rejected(
          Zip.open(zip([{ name: `dos-${type}`, creator: 0, attributes }]).bytes, options()),
          'unsupported',
        );
      }
      await rejected(
        Zip.open(
          zip([{ name: 'wrong/', creator: 3, attributes: regular | 0x10 }]).bytes,
          options(),
        ),
        'malformed',
      );
      await rejected(
        Zip.open(
          zip([{ name: 'missing-dos/', creator: 3, attributes: directory & ~0x10 }]).bytes,
          options(),
        ),
        'malformed',
      );
      await rejected(
        Zip.open(zip([{ name: 'volume', attributes: 0x08 }]).bytes, options()),
        'unsupported',
      );
    });
  });

  describe('portable names and admission limits', () => {
    it('rejects unsafe names, aliases, and file-as-parent conflicts', async () => {
      const names = [
        '/absolute',
        '../up',
        'a/../up',
        'a//empty',
        'a\\windows',
        'C:drive',
        'CON.txt',
        'clock$.log',
        'COM¹.bin',
        '.sys.rooted-stage',
        'trailing.',
        'trailing ',
        'line\nfeed',
        'format\u200dmark',
        'separator\u2028mark',
        'control\u0085mark',
        'e\u0301.txt',
      ];
      for (const name of names) {
        await rejected(Zip.open(zip([{ name }]).bytes, options()), 'invalid-name');
      }

      const devices = [
        'CON',
        'PRN',
        'AUX',
        'NUL',
        'CLOCK$',
        'CONIN$',
        'CONOUT$',
        ...Array.from({ length: 9 }, (_, index) => `COM${index + 1}`),
        ...Array.from({ length: 9 }, (_, index) => `LPT${index + 1}`),
        'COM¹',
        'COM²',
        'COM³',
        'LPT¹',
        'LPT²',
        'LPT³',
      ];
      for (const device of devices) {
        await rejected(Zip.open(zip([{ name: `${device}.ext` }]).bytes, options()), 'invalid-name');
      }

      const explicitAfterImplicit = await Zip.open(
        zip([{ name: 'same/child' }, { name: 'same/' }]).bytes,
        options(),
      );
      expect(explicitAfterImplicit.inspect().treeEntryCount).to.eql(2);

      for (
        const entries of [
          [{ name: 'A' }, { name: 'a' }],
          [{ name: 'file' }, { name: 'file/child' }],
          [{ name: 'parent/child' }, { name: 'parent' }],
          [{ name: 'A/child' }, { name: 'a/other' }],
          [{ name: 'A/child' }, { name: 'a/' }],
          [{ name: 'A/' }, { name: 'a/child' }],
        ]
      ) {
        await rejected(Zip.open(zip(entries).bytes, options()), 'collision');
      }
    });

    it('rejects invalid UTF-8 and non-ASCII legacy names', async () => {
      for (const utf8 of [true, false]) {
        const fixture = zip([{ name: 'x', utf8 }]);
        fixture.bytes[30] = 0xff;
        fixture.bytes[fixture.centralOffset + 46] = 0xff;
        await rejected(Zip.open(fixture.bytes, options()), 'invalid-name');
      }
    });

    it('enforces entry, tree, path, depth, and declared expansion limits', async () => {
      const two = zip([{ name: 'one', data: '123' }, { name: 'two', data: '12' }]);
      expect(
        (await Zip.open(two.bytes, options({ ...LIMITS, maxEntries: 2 }))).inspect().fileCount,
      ).to.eql(2);
      await rejected(
        Zip.open(two.bytes, options({ ...LIMITS, maxEntries: 1 })),
        'entry-limit',
      );

      const deep = zip([{ name: 'a/b/c' }]);
      expect(
        (await Zip.open(
          deep.bytes,
          options({ ...LIMITS, maxTreeEntries: 3, maxPathDepth: 3, maxPathBytes: 5 }),
        )).inspect().treeEntryCount,
      ).to.eql(3);
      await rejected(
        Zip.open(deep.bytes, options({ ...LIMITS, maxTreeEntries: 2 })),
        'tree-limit',
      );
      await rejected(
        Zip.open(deep.bytes, options({ ...LIMITS, maxPathDepth: 2 })),
        'path-limit',
      );
      await rejected(
        Zip.open(deep.bytes, options({ ...LIMITS, maxPathBytes: 4 })),
        'path-limit',
      );

      const expanded = zip([{ name: 'large', data: '12345' }]);
      expect(
        (await Zip.open(
          expanded.bytes,
          options({ ...LIMITS, maxEntryBytes: 5, maxExpandedBytes: 5 }),
        )).inspect().expandedBytes,
      ).to.eql(5);
      await rejected(
        Zip.open(expanded.bytes, options({ ...LIMITS, maxEntryBytes: 4 })),
        'expanded-limit',
      );
      await rejected(
        Zip.open(expanded.bytes, options({ ...LIMITS, maxExpandedBytes: 4 })),
        'expanded-limit',
      );
      await rejected(
        Zip.open(two.bytes, options({ ...LIMITS, maxExpandedBytes: 4 })),
        'expanded-limit',
      );
    });
  });

  describe('payload integrity', () => {
    it('rejects CRC, size, expansion, and malformed DEFLATE evidence', async () => {
      const badCrc = zip([{ name: 'crc.txt', data: 'value', crc32: 1 }]);
      const crcArchive = await Zip.open(badCrc.bytes, options());
      const crcFailure = await rejected(
        crcArchive.test({ timeout: 10_000 }),
        'crc-mismatch',
        'test',
      );
      expect(crcFailure.entryIndex).to.eql(0);
      expect(Object.keys(crcFailure)).to.eql(['name', 'operation', 'kind', 'entryIndex']);

      const badSize = zip([{ name: 'size.txt', data: 'value', method: 8, expandedSize: 6 }]);
      const sizeArchive = await Zip.open(badSize.bytes, options());
      await rejected(sizeArchive.test({ timeout: 10_000 }), 'size-mismatch', 'test');

      const data = new TextEncoder().encode(PINNED_DEFLATE_TEXT);
      const compressed = pinnedDeflateBytes();
      const unfinished = compressed.slice(0, -1);
      const unfinishedArchive = await Zip.open(
        zip([{
          name: 'unfinished.txt',
          data,
          method: 8,
          compressed: unfinished,
        }]).bytes,
        options(),
      );
      await rejected(unfinishedArchive.test({ timeout: 10_000 }), 'deflate-failure', 'test');

      const clearedFinal = compressed.slice();
      clearedFinal[0] &= 0xfe;
      const clearedFinalArchive = await Zip.open(
        zip([{ name: 'no-final.txt', data, method: 8, compressed: clearedFinal }]).bytes,
        options(),
      );
      await rejected(clearedFinalArchive.test({ timeout: 10_000 }), 'deflate-failure', 'test');

      const malformedArchive = await Zip.open(
        zip([{
          name: 'malformed.txt',
          data,
          method: 8,
          compressed: new Uint8Array([0xff, 0xff, 0xff, 0xff]),
        }]).bytes,
        options(),
      );
      await rejected(malformedArchive.test({ timeout: 10_000 }), 'deflate-failure', 'test');

      const trailing = new Uint8Array(compressed.byteLength + 1);
      trailing.set(compressed);
      trailing[trailing.length - 1] = 0;
      const trailingArchive = await Zip.open(
        zip([{ name: 'trailing.txt', data, method: 8, compressed: trailing }]).bytes,
        options(),
      );
      await rejected(trailingArchive.test({ timeout: 10_000 }), 'deflate-failure', 'test');

      const concatenated = new Uint8Array(compressed.byteLength * 2);
      concatenated.set(compressed);
      concatenated.set(compressed, compressed.byteLength);
      const concatenatedArchive = await Zip.open(
        zip([{ name: 'concatenated.txt', data, method: 8, compressed: concatenated }]).bytes,
        options(),
      );
      await rejected(concatenatedArchive.test({ timeout: 10_000 }), 'deflate-failure', 'test');

      const expansionArchive = await Zip.open(
        zip([{ name: 'expands.txt', data: '1234567890', method: 8, expandedSize: 4 }]).bytes,
        options({ ...LIMITS, maxEntryBytes: 5 }),
      );
      await rejected(expansionArchive.test({ timeout: 10_000 }), 'expanded-limit', 'test');
    });

    it('matches CRC evidence across 64-KiB chunk boundaries', async () => {
      for (const size of [64 * 1024 - 1, 64 * 1024, 64 * 1024 + 1, 1024 * 1024]) {
        const data = new Uint8Array(size);
        for (let index = 0; index < data.length; index++) data[index] = index % 251;
        for (const method of [0, 8] as const) {
          const archive = await Zip.open(
            zip([{ name: `${method}-${size}.bin`, data, method }]).bytes,
            options(),
          );
          expect((await archive.test({ timeout: 10_000 })).expandedBytes).to.eql(size);
        }
      }
    });

    it('rejects pre-cancelled and zero-budget integrity operations', async () => {
      const archive = await Zip.open(zip([{ name: 'value', data: 'value' }]).bytes, options());
      const controller = new AbortController();
      controller.abort('stop');
      await rejected(
        archive.test({ timeout: 10_000, until: controller.signal }),
        'cancelled',
        'test',
      );
      await rejected(archive.test({ timeout: 0 }), 'timeout', 'test');
    });
  });
});
