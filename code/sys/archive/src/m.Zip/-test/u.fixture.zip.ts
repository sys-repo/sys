import { crc32, deflateRawSync } from 'node:zlib';

const encoder = new TextEncoder();

/**
 * Deno 2.9.6 built-in `node:zlib.deflateRawSync` output for UTF-8 `deflate evidence`.
 * The integrity suite reproduces these bytes and verifies their `@sys/crypto` SHA-256 digest.
 */
const PINNED_DEFLATE_BYTES: readonly number[] = Object.freeze([
  75,
  73,
  77,
  203,
  73,
  44,
  73,
  85,
  72,
  45,
  203,
  76,
  73,
  205,
  75,
  78,
  5,
  0,
]);

export const PINNED_DEFLATE_TEXT = 'deflate evidence';
export const PINNED_DEFLATE_SHA256 =
  'sha256-6e5957493418e2811d12fe9d07bcc3d4e368c30eac3d4f001cd5f1e7f424166d';

/** Return a fresh copy of the pinned raw-DEFLATE bytes. */
export function pinnedDeflateBytes(): Uint8Array {
  return new Uint8Array(PINNED_DEFLATE_BYTES);
}

export type EntryInput = {
  name: string;
  data?: string | Uint8Array;
  method?: 0 | 8;
  utf8?: boolean;
  descriptor?: false | 'signed' | 'unsigned';
  creator?: 0 | 3;
  attributes?: number;
  versionNeeded?: 10 | 20 | number;
  centralExtra?: Uint8Array;
  localExtra?: Uint8Array;
  comment?: Uint8Array;
  compressed?: Uint8Array;
  crc32?: number;
  expandedSize?: number;
  compressedSize?: number;
};

export type Fixture = {
  readonly bytes: Uint8Array;
  readonly centralOffset: number;
  readonly eocdOffset: number;
  readonly localOffsets: readonly number[];
  readonly centralOffsets: readonly number[];
};

/**
 * Deterministically assemble records pinned to APPNOTE 6.3.10: local headers and payloads use
 * sections 4.3.7–4.3.9, central records use 4.3.12, EOCD uses 4.3.16, and individual field values
 * follow section 4.4. Creator `3` attributes use the separately pinned Info-ZIP 6.0 `mapattr()`
 * upper-word convention. Each call site names its expected semantic result; hostile cases mutate
 * these independently assembled record fields and assert one exact failure kind.
 *
 * Stored payload bytes are copied verbatim and their ZIP CRC is written explicitly. Method-8 bytes
 * either come from Deno 2.9.6 `node:zlib.deflateRawSync` or are supplied as pinned bytes whose
 * `@sys/crypto` digest and canonical expanded content are asserted by the owning test.
 */
export function zip(
  entries: EntryInput[] = [],
  options: { comment?: Uint8Array } = {},
): Fixture {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  const localOffsets: number[] = [];
  const centralOffsets: number[] = [];
  let localOffset = 0;

  for (const input of entries) {
    const name = encoder.encode(input.name);
    const data = typeof input.data === 'string'
      ? encoder.encode(input.data)
      : (input.data?.slice() ?? new Uint8Array());
    const method = input.method ?? 0;
    const compressed = input.compressed?.slice() ??
      (method === 8 ? new Uint8Array(deflateRawSync(data)) : data.slice());
    const checksum = input.crc32 ?? (crc32(data) >>> 0);
    const expandedSize = input.expandedSize ?? data.byteLength;
    const compressedSize = input.compressedSize ?? compressed.byteLength;
    const descriptor = input.descriptor ?? false;
    const flags = (input.utf8 === false ? 0 : 0x0800) | (descriptor ? 0x0008 : 0);
    const versionNeeded = input.versionNeeded ?? (method === 8 || descriptor ? 20 : 10);
    const localExtra = input.localExtra?.slice() ?? new Uint8Array();
    const centralExtra = input.centralExtra?.slice() ?? new Uint8Array();
    const comment = input.comment?.slice() ?? new Uint8Array();
    const creator = input.creator ?? 0;
    const directory = input.name.endsWith('/');
    const attributes = input.attributes ?? (directory ? 0x10 : 0);

    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    u32(localView, 0, 0x04034b50);
    u16(localView, 4, versionNeeded);
    u16(localView, 6, flags);
    u16(localView, 8, method);
    u32(localView, 14, descriptor ? 0 : checksum);
    u32(localView, 18, descriptor ? 0 : compressedSize);
    u32(localView, 22, descriptor ? 0 : expandedSize);
    u16(localView, 26, name.byteLength);
    u16(localView, 28, localExtra.byteLength);

    const descriptorBytes = descriptor
      ? makeDescriptor(checksum, compressedSize, expandedSize, descriptor === 'signed')
      : new Uint8Array();
    const local = concat(localHeader, name, localExtra, compressed, descriptorBytes);
    localOffsets.push(localOffset);
    locals.push(local);

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    u32(centralView, 0, 0x02014b50);
    u16(centralView, 4, (creator << 8) | 20);
    u16(centralView, 6, versionNeeded);
    u16(centralView, 8, flags);
    u16(centralView, 10, method);
    u32(centralView, 16, checksum);
    u32(centralView, 20, compressedSize);
    u32(centralView, 24, expandedSize);
    u16(centralView, 28, name.byteLength);
    u16(centralView, 30, centralExtra.byteLength);
    u16(centralView, 32, comment.byteLength);
    u16(centralView, 34, 0);
    u32(centralView, 38, attributes);
    u32(centralView, 42, localOffset);
    centrals.push(concat(centralHeader, name, centralExtra, comment));
    localOffset += local.byteLength;
  }

  const centralOffset = localOffset;
  let centralLength = 0;
  for (const central of centrals) {
    centralOffsets.push(centralOffset + centralLength);
    centralLength += central.byteLength;
  }

  const archiveComment = options.comment?.slice() ?? new Uint8Array();
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  u32(eocdView, 0, 0x06054b50);
  u16(eocdView, 8, entries.length);
  u16(eocdView, 10, entries.length);
  u32(eocdView, 12, centralLength);
  u32(eocdView, 16, centralOffset);
  u16(eocdView, 20, archiveComment.byteLength);

  return Object.freeze({
    bytes: concat(...locals, ...centrals, eocd, archiveComment),
    centralOffset,
    eocdOffset: centralOffset + centralLength,
    localOffsets: Object.freeze(localOffsets),
    centralOffsets: Object.freeze(centralOffsets),
  });
}

export function extra(id: number, body: Uint8Array): Uint8Array {
  const header = new Uint8Array(4);
  const view = new DataView(header.buffer);
  u16(view, 0, id);
  u16(view, 2, body.byteLength);
  return concat(header, body);
}

export function clone(input: Uint8Array): Uint8Array {
  return input.slice();
}

export function setU16(bytes: Uint8Array, offset: number, value: number): Uint8Array {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint16(offset, value, true);
  return bytes;
}

export function setU32(bytes: Uint8Array, offset: number, value: number): Uint8Array {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(offset, value, true);
  return bytes;
}

function makeDescriptor(crc: number, compressed: number, expanded: number, signed: boolean) {
  const bytes = new Uint8Array(signed ? 16 : 12);
  const view = new DataView(bytes.buffer);
  let offset = 0;
  if (signed) {
    u32(view, offset, 0x08074b50);
    offset += 4;
  }
  u32(view, offset, crc);
  u32(view, offset + 4, compressed);
  u32(view, offset + 8, expanded);
  return bytes;
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  let length = 0;
  for (const part of parts) length += part.byteLength;
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function u16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function u32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}
