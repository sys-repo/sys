import { Arr, Num, type t } from '../common.ts';
import { failure } from './u.failure.ts';
import type { OperationContext } from './u.operation.ts';

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;
const DESCRIPTOR = 0x08074b50;
const CENTRAL_DIGITAL_SIGNATURE = 0x05054b50;
const ARCHIVE_EXTRA_DATA = 0x08064b50;
const ZIP64_EOCD = 0x06064b50;
const ZIP64_LOCATOR = 0x07064b50;
const ZIP64_SENTINEL_16 = 0xffff;
const ZIP64_SENTINEL_32 = 0xffffffff;
const EOCD_FIXED = 22;
const CENTRAL_FIXED = 46;
const LOCAL_FIXED = 30;
const BYTE_QUANTUM = 1024 * 1024;
const RECORD_QUANTUM = 32;
const ALLOWED_FLAGS = 0x080e;
const UTF8_FLAG = 0x0800;
const DESCRIPTOR_FLAG = 0x0008;
const DEFLATE_FLAGS = 0x0006;
const DOS_DIRECTORY = 0x10;
const DOS_VOLUME_LABEL = 0x08;
const UNIX_TYPE_MASK = 0o170000;
const UNIX_REGULAR = 0o100000;
const UNIX_DIRECTORY = 0o040000;

const NativeDataView = DataView;
const NativeTextDecoder = TextDecoder;
const decodeUtf8 = new NativeTextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const normalize = String.prototype.normalize;
const toLowerCase = String.prototype.toLowerCase;
const toUpperCase = String.prototype.toUpperCase;
const subarray = Uint8Array.prototype.subarray;
// deno-lint-ignore no-control-regex -- Portable paths reject C0/C1 controls and format controls.
const CONTROL_OR_FORMAT = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\p{Cf}]/u;
const WINDOWS_FORBIDDEN = /[<>:"|?*]/u;
const DRIVE_PREFIX = /^[A-Za-z]:/u;
const DEVICE = /^(?:CON|PRN|AUX|NUL|CLOCK\$|CONIN\$|CONOUT\$|COM[1-9¹²³]|LPT[1-9¹²³])$/u;

export type ParsedEntry = {
  readonly metadata: t.Zip.Entry;
  readonly dataOffset: number;
};

export type ParsedArchive = {
  readonly entries: readonly ParsedEntry[];
  readonly inspection: t.Zip.Inspection;
};

type CentralEntry = {
  readonly metadata: t.Zip.Entry;
  readonly rawNameOffset: number;
  readonly rawNameLength: number;
  readonly flags: number;
  readonly method: number;
  readonly versionNeeded: number;
};

type EocdRecord = {
  readonly offset: number;
  readonly entries: number;
  readonly centralOffset: number;
  readonly centralSize: number;
};

/** Parse and freeze one strict ZIP32 snapshot. */
export async function parseZip(
  bytes: Uint8Array,
  limits: t.Zip.Limits,
  context: OperationContext,
): Promise<ParsedArchive> {
  const view = new NativeDataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const meter = new ParseMeter(context);
  context.checkpoint();
  const eocd = findEocd(view, context);
  await meter.linear(Math.min(bytes.byteLength, EOCD_FIXED + 0xffff));

  if (eocd.entries > limits.maxEntries) fail(context, 'entry-limit');
  const centralEnd = checkedAdd(eocd.centralOffset, eocd.centralSize, context);
  if (centralEnd !== eocd.offset) fail(context, 'malformed');

  const central: CentralEntry[] = [];
  const pathAliases = new Set<string>();
  const fileAliases = new Set<string>();
  const directoryAliases = new Map<string, string>();
  const parentAliases = new Map<string, string>();
  const treeNodes = new Set<string>();
  let centralCursor = eocd.centralOffset;
  let previousLocalOffset = -1;
  let fileCount = 0;
  let directoryCount = 0;
  let compressedBytes = 0;
  let expandedBytes = 0;
  let storedEntries = 0;
  let deflatedEntries = 0;
  let utf8Entries = 0;
  let descriptorEntries = 0;

  for (let index = 0; index < eocd.entries; index++) {
    await meter.record(CENTRAL_FIXED);
    requireRange(centralCursor, CENTRAL_FIXED, centralEnd, context);
    if (u32(view, centralCursor) !== CENTRAL) {
      failKnownRecord(view, centralCursor, context);
    }

    const versionMadeBy = u16(view, centralCursor + 4);
    const creator = versionMadeBy >>> 8;
    const versionNeeded = u16(view, centralCursor + 6);
    const flags = u16(view, centralCursor + 8);
    const method = u16(view, centralCursor + 10);
    const crc32 = u32(view, centralCursor + 16);
    const compressedSize = u32(view, centralCursor + 20);
    const expandedSize = u32(view, centralCursor + 24);
    const nameLength = u16(view, centralCursor + 28);
    const extraLength = u16(view, centralCursor + 30);
    const commentLength = u16(view, centralCursor + 32);
    const diskStart = u16(view, centralCursor + 34);
    const attributes = u32(view, centralCursor + 38);
    const localHeaderOffset = u32(view, centralCursor + 42);

    if (
      compressedSize === ZIP64_SENTINEL_32 ||
      expandedSize === ZIP64_SENTINEL_32 ||
      localHeaderOffset === ZIP64_SENTINEL_32 ||
      diskStart === ZIP64_SENTINEL_16
    ) {
      fail(context, 'unsupported');
    }
    if (diskStart !== 0 || (creator !== 0 && creator !== 3)) fail(context, 'unsupported');
    if (versionNeeded !== 10 && versionNeeded !== 20) fail(context, 'unsupported');
    if ((flags & ~ALLOWED_FLAGS) !== 0) fail(context, 'unsupported');
    if (method !== 0 && method !== 8) fail(context, 'unsupported');
    if (method === 0 && (flags & DEFLATE_FLAGS) !== 0) fail(context, 'unsupported');
    if (method === 0 && compressedSize !== expandedSize) fail(context, 'malformed');

    const dataDescriptor = (flags & DESCRIPTOR_FLAG) !== 0;
    if ((method === 8 || dataDescriptor) && versionNeeded !== 20) fail(context, 'unsupported');

    const variableLength = checkedAdd(
      checkedAdd(nameLength, extraLength, context),
      commentLength,
      context,
    );
    await meter.linear(variableLength);
    const recordEnd = checkedAdd(
      checkedAdd(centralCursor, CENTRAL_FIXED, context),
      variableLength,
      context,
    );
    requireRange(centralCursor, CENTRAL_FIXED + variableLength, centralEnd, context);

    const rawNameOffset = centralCursor + CENTRAL_FIXED;
    const extraOffset = rawNameOffset + nameLength;
    parseExtra(view, extraOffset, extraLength, 'central', context);
    const utf8 = (flags & UTF8_FLAG) !== 0;
    const path = decodeName(bytes, rawNameOffset, nameLength, utf8, limits, context);
    const kind = classifyKind(path, creator, attributes, context);

    if (expandedSize > limits.maxEntryBytes) fail(context, 'expanded-limit');
    compressedBytes = checkedAdd(compressedBytes, compressedSize, context);
    expandedBytes = checkedAdd(expandedBytes, expandedSize, context);
    if (expandedBytes > limits.maxExpandedBytes) fail(context, 'expanded-limit');
    if (localHeaderOffset <= previousLocalOffset) fail(context, 'malformed');
    previousLocalOffset = localHeaderOffset;

    admitPath(
      path,
      kind,
      limits,
      context,
      pathAliases,
      fileAliases,
      directoryAliases,
      parentAliases,
      treeNodes,
    );

    const compression: t.Zip.Compression = method === 0 ? 'stored' : 'deflate';
    const deflateOption = deflateOptionOf(method, flags);
    const metadata: t.Zip.Entry = Object.freeze({
      index,
      path,
      kind,
      creatorSystem: creator === 0 ? 'ms-dos' : 'unix',
      compression,
      deflateOption,
      utf8,
      dataDescriptor,
      crc32,
      compressedBytes: compressedSize,
      expandedBytes: expandedSize,
      localHeaderOffset,
    });

    if (kind === 'directory') {
      if (
        method !== 0 || dataDescriptor || compressedSize !== 0 || expandedSize !== 0 || crc32 !== 0
      ) {
        fail(context, 'malformed');
      }
      directoryCount++;
    } else {
      fileCount++;
    }
    if (method === 0) storedEntries++;
    else deflatedEntries++;
    if (utf8) utf8Entries++;
    if (dataDescriptor) descriptorEntries++;

    central.push(
      Object.freeze({
        metadata,
        rawNameOffset,
        rawNameLength: nameLength,
        flags,
        method,
        versionNeeded,
      }),
    );
    centralCursor = recordEnd;
    await meter.complete();
  }

  if (centralCursor !== centralEnd) {
    if (centralCursor + 4 <= centralEnd) failKnownRecord(view, centralCursor, context);
    fail(context, 'malformed');
  }
  if (treeNodes.size > limits.maxTreeEntries) fail(context, 'tree-limit');

  const parsedEntries: ParsedEntry[] = [];
  let localCursor = 0;
  for (const entry of central) {
    const index = entry.metadata.index;
    context.checkpoint(index);
    if (entry.metadata.localHeaderOffset !== localCursor) fail(context, 'malformed', index);
    await meter.record(LOCAL_FIXED, index);
    requireRange(localCursor, LOCAL_FIXED, eocd.centralOffset, context, index);
    if (u32(view, localCursor) !== LOCAL) failKnownRecord(view, localCursor, context, index);

    const versionNeeded = u16(view, localCursor + 4);
    const flags = u16(view, localCursor + 6);
    const method = u16(view, localCursor + 8);
    const crc32 = u32(view, localCursor + 14);
    const compressedSize = u32(view, localCursor + 18);
    const expandedSize = u32(view, localCursor + 22);
    const nameLength = u16(view, localCursor + 26);
    const extraLength = u16(view, localCursor + 28);
    const variableLength = checkedAdd(nameLength, extraLength, context, index);
    await meter.linear(variableLength, index);
    requireRange(localCursor, LOCAL_FIXED + variableLength, eocd.centralOffset, context, index);

    if (
      versionNeeded !== entry.versionNeeded ||
      flags !== entry.flags ||
      method !== entry.method ||
      nameLength !== entry.rawNameLength
    ) {
      fail(context, 'malformed', index);
    }

    const rawNameOffset = localCursor + LOCAL_FIXED;
    if (!equalBytes(bytes, rawNameOffset, entry.rawNameOffset, nameLength)) {
      fail(context, 'malformed', index);
    }
    parseExtra(view, rawNameOffset + nameLength, extraLength, 'local', context, index);

    if (entry.metadata.dataDescriptor) {
      if (crc32 !== 0 || compressedSize !== 0 || expandedSize !== 0) {
        fail(context, 'malformed', index);
      }
    } else if (
      crc32 !== entry.metadata.crc32 ||
      compressedSize !== entry.metadata.compressedBytes ||
      expandedSize !== entry.metadata.expandedBytes
    ) {
      fail(context, 'malformed', index);
    }

    const dataOffset = checkedAdd(
      checkedAdd(localCursor, LOCAL_FIXED, context, index),
      variableLength,
      context,
      index,
    );
    const payloadEnd = checkedAdd(dataOffset, entry.metadata.compressedBytes, context, index);
    const nextBoundary = index + 1 < central.length
      ? central[index + 1].metadata.localHeaderOffset
      : eocd.centralOffset;
    requireRange(dataOffset, entry.metadata.compressedBytes, nextBoundary, context, index);

    let recordEnd = payloadEnd;
    if (entry.metadata.dataDescriptor) {
      recordEnd = descriptorEnd(view, payloadEnd, nextBoundary, entry.metadata, context);
    }
    if (recordEnd !== nextBoundary) fail(context, 'malformed', index);

    parsedEntries.push(Object.freeze({ metadata: entry.metadata, dataOffset }));
    localCursor = recordEnd;
    await meter.complete(index);
  }

  if (localCursor !== eocd.centralOffset) fail(context, 'malformed');
  context.checkpoint();

  const entries = Object.freeze(parsedEntries.slice());
  const publicEntries = Object.freeze(entries.map((entry) => entry.metadata));
  const usage: t.Zip.Usage = Object.freeze({
    storedEntries,
    deflatedEntries,
    utf8Entries,
    descriptorEntries,
  });
  const inspection: t.Zip.Inspection = Object.freeze({
    format: 'zip32',
    sourceBytes: bytes.byteLength,
    fileCount,
    directoryCount,
    treeEntryCount: treeNodes.size,
    compressedBytes,
    expandedBytes,
    usage,
    entries: publicEntries,
  });
  return Object.freeze({ entries, inspection });
}

function findEocd(view: DataView, context: OperationContext): EocdRecord {
  if (view.byteLength < EOCD_FIXED) fail(context, 'malformed');
  const first = Math.max(0, view.byteLength - EOCD_FIXED - 0xffff);
  const last = view.byteLength - EOCD_FIXED;
  const candidates: EocdRecord[] = [];
  const lengthCandidates: number[] = [];

  for (let offset = first; offset <= last; offset++) {
    if (u32(view, offset) !== EOCD) continue;
    const commentLength = u16(view, offset + 20);
    if (offset + EOCD_FIXED + commentLength !== view.byteLength) continue;
    lengthCandidates.push(offset);

    const disk = u16(view, offset + 4);
    const centralDisk = u16(view, offset + 6);
    const entriesOnDisk = u16(view, offset + 8);
    const entries = u16(view, offset + 10);
    const centralSize = u32(view, offset + 12);
    const centralOffset = u32(view, offset + 16);
    if (
      disk !== 0 ||
      centralDisk !== 0 ||
      entriesOnDisk !== entries ||
      entries === ZIP64_SENTINEL_16 ||
      centralSize === ZIP64_SENTINEL_32 ||
      centralOffset === ZIP64_SENTINEL_32
    ) {
      continue;
    }
    if (!Num.Is.safeInt(centralOffset + centralSize) || centralOffset + centralSize !== offset) {
      continue;
    }
    candidates.push(Object.freeze({ offset, entries, centralOffset, centralSize }));
  }

  context.checkpoint();
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) fail(context, 'malformed');
  if (lengthCandidates.length === 1) {
    const offset = lengthCandidates[0];
    if (
      u16(view, offset + 4) !== 0 ||
      u16(view, offset + 6) !== 0 ||
      u16(view, offset + 8) !== u16(view, offset + 10) ||
      u16(view, offset + 10) === ZIP64_SENTINEL_16 ||
      u32(view, offset + 12) === ZIP64_SENTINEL_32 ||
      u32(view, offset + 16) === ZIP64_SENTINEL_32
    ) {
      fail(context, 'unsupported');
    }
  }
  fail(context, 'malformed');
}

function parseExtra(
  view: DataView,
  offset: number,
  length: number,
  location: 'central' | 'local',
  context: OperationContext,
  entryIndex?: number,
): void {
  const end = checkedAdd(offset, length, context, entryIndex);
  const seen = new Set<number>();
  let cursor = offset;
  while (cursor < end) {
    requireRange(cursor, 4, end, context, entryIndex);
    const id = u16(view, cursor);
    const size = u16(view, cursor + 2);
    cursor += 4;
    requireRange(cursor, size, end, context, entryIndex);
    if (seen.has(id)) fail(context, 'malformed', entryIndex);
    seen.add(id);

    if (id === 0x5455) parseTimestamp(view, cursor, size, location, context, entryIndex);
    else if (id === 0x7875) parseUnixIdentity(view, cursor, size, context, entryIndex);
    else fail(context, 'unsupported', entryIndex);
    cursor += size;
  }
  if (cursor !== end) fail(context, 'malformed', entryIndex);
}

function parseTimestamp(
  view: DataView,
  offset: number,
  length: number,
  location: 'central' | 'local',
  context: OperationContext,
  entryIndex?: number,
): void {
  if (length < 1) fail(context, 'malformed', entryIndex);
  const flags = view.getUint8(offset);
  if ((flags & ~0x07) !== 0) fail(context, 'malformed', entryIndex);
  if (location === 'central' && (flags & ~0x01) !== 0) fail(context, 'malformed', entryIndex);
  const words = bitCount(flags & (location === 'central' ? 0x01 : 0x07));
  if (length !== 1 + words * 4) fail(context, 'malformed', entryIndex);
}

function parseUnixIdentity(
  view: DataView,
  offset: number,
  length: number,
  context: OperationContext,
  entryIndex?: number,
): void {
  if (length < 5 || view.getUint8(offset) !== 1) fail(context, 'malformed', entryIndex);
  let cursor = offset + 1;
  const end = offset + length;
  const uidBytes = view.getUint8(cursor++);
  if (uidBytes < 1 || uidBytes > 8 || cursor + uidBytes >= end) {
    fail(context, 'malformed', entryIndex);
  }
  cursor += uidBytes;
  const gidBytes = view.getUint8(cursor++);
  if (gidBytes < 1 || gidBytes > 8 || cursor + gidBytes !== end) {
    fail(context, 'malformed', entryIndex);
  }
}

function decodeName(
  bytes: Uint8Array,
  offset: number,
  length: number,
  utf8: boolean,
  limits: t.Zip.Limits,
  context: OperationContext,
): string {
  if (length === 0) fail(context, 'invalid-name');
  if (length > limits.maxPathBytes) fail(context, 'path-limit');
  const raw = subarray.call(bytes, offset, offset + length);
  let path: string;
  if (utf8) {
    try {
      path = decodeUtf8.decode(raw);
    } catch (cause) {
      throw failure(context.operation, 'invalid-name', {
        maxErrorChars: limits.maxErrorChars,
        cause,
      });
    }
  } else {
    for (const byte of raw) {
      if (byte < 0x20 || byte > 0x7e) fail(context, 'invalid-name');
    }
    path = decodeUtf8.decode(raw);
  }

  if (!path || normalize.call(path, 'NFC') !== path) fail(context, 'invalid-name');
  if (
    path.startsWith('/') ||
    path.startsWith('\\') ||
    DRIVE_PREFIX.test(path) ||
    path.includes('\\') ||
    CONTROL_OR_FORMAT.test(path)
  ) {
    fail(context, 'invalid-name');
  }

  const directory = path.endsWith('/');
  const body = directory ? path.slice(0, -1) : path;
  const components = body.split('/');
  if (components.length > limits.maxPathDepth) fail(context, 'path-limit');
  if (components.some((component) => invalidComponent(component))) fail(context, 'invalid-name');
  return path;
}

function invalidComponent(component: string): boolean {
  if (!component || component === '.' || component === '..') return true;
  if (WINDOWS_FORBIDDEN.test(component) || component.endsWith('.') || component.endsWith(' ')) {
    return true;
  }
  const lower = toLowerCase.call(component);
  if (lower.startsWith('.sys.rooted')) return true;
  const base = component.split('.')[0];
  return DEVICE.test(toUpperCase.call(base));
}

function classifyKind(
  path: string,
  creator: number,
  attributes: number,
  context: OperationContext,
): t.Zip.EntryKind {
  const trailingDirectory = path.endsWith('/');
  const dos = attributes & 0xff;
  if ((dos & DOS_VOLUME_LABEL) !== 0) fail(context, 'unsupported');
  if (((dos & DOS_DIRECTORY) !== 0) !== trailingDirectory) fail(context, 'malformed');

  const unixType = (attributes >>> 16) & UNIX_TYPE_MASK;
  if (creator === 0) {
    if (unixType !== 0) fail(context, 'unsupported');
  } else {
    if (unixType !== 0 && unixType !== UNIX_REGULAR && unixType !== UNIX_DIRECTORY) {
      fail(context, 'unsupported');
    }
    if (unixType === UNIX_REGULAR && trailingDirectory) fail(context, 'malformed');
    if (unixType === UNIX_DIRECTORY && !trailingDirectory) fail(context, 'malformed');
  }
  return trailingDirectory ? 'directory' : 'file';
}

function admitPath(
  path: string,
  kind: t.Zip.EntryKind,
  limits: t.Zip.Limits,
  context: OperationContext,
  pathAliases: Set<string>,
  fileAliases: Set<string>,
  directoryAliases: Map<string, string>,
  parentAliases: Map<string, string>,
  treeNodes: Set<string>,
): void {
  const body = kind === 'directory' ? path.slice(0, -1) : path;
  const components = body.split('/');
  const aliases = collisionAliases(components);
  if (aliases.some((alias) => pathAliases.has(alias))) fail(context, 'collision');
  if (kind === 'file' && aliases.some((alias) => parentAliases.has(alias))) {
    fail(context, 'collision');
  }
  if (
    kind === 'directory' &&
    aliases.some((alias) => {
      const owner = parentAliases.get(alias);
      return owner !== undefined && owner !== body;
    })
  ) {
    fail(context, 'collision');
  }

  for (let index = 1; index < components.length; index++) {
    const prefixComponents = components.slice(0, index);
    const prefix = prefixComponents.join('/');
    const prefixAliases = collisionAliases(prefixComponents);
    if (prefixAliases.some((alias) => fileAliases.has(alias))) fail(context, 'collision');
    for (const alias of prefixAliases) {
      const directoryOwner = directoryAliases.get(alias);
      if (directoryOwner !== undefined && directoryOwner !== prefix) fail(context, 'collision');
      const parentOwner = parentAliases.get(alias);
      if (parentOwner !== undefined && parentOwner !== prefix) fail(context, 'collision');
      parentAliases.set(alias, prefix);
    }
    treeNodes.add(prefix);
    if (treeNodes.size > limits.maxTreeEntries) fail(context, 'tree-limit');
  }

  for (const alias of aliases) pathAliases.add(alias);
  if (kind === 'file') {
    for (const alias of aliases) fileAliases.add(alias);
  } else {
    for (const alias of aliases) directoryAliases.set(alias, body);
  }
  treeNodes.add(body);
  if (treeNodes.size > limits.maxTreeEntries) fail(context, 'tree-limit');
}

function collisionAliases(components: readonly string[]): readonly string[] {
  const exact = components.join('/');
  const nfd = normalize.call(exact, 'NFD');
  const lower = toLowerCase.call(exact);
  return Arr.uniq([
    exact,
    nfd,
    normalize.call(lower, 'NFC'),
    normalize.call(lower, 'NFD'),
  ]);
}

function descriptorEnd(
  view: DataView,
  offset: number,
  boundary: number,
  entry: t.Zip.Entry,
  context: OperationContext,
): number {
  const matches: number[] = [];
  if (offset + 12 === boundary && offset + 12 <= view.byteLength) {
    if (
      u32(view, offset) === entry.crc32 &&
      u32(view, offset + 4) === entry.compressedBytes &&
      u32(view, offset + 8) === entry.expandedBytes
    ) {
      matches.push(offset + 12);
    }
  }
  if (
    offset + 16 === boundary && offset + 16 <= view.byteLength && u32(view, offset) === DESCRIPTOR
  ) {
    if (
      u32(view, offset + 4) === entry.crc32 &&
      u32(view, offset + 8) === entry.compressedBytes &&
      u32(view, offset + 12) === entry.expandedBytes
    ) {
      matches.push(offset + 16);
    }
  }
  if (matches.length !== 1) fail(context, 'malformed', entry.index);
  return matches[0];
}

function deflateOptionOf(method: number, flags: number): t.Zip.DeflateOption {
  if (method === 0) return 'none';
  switch ((flags & DEFLATE_FLAGS) >>> 1) {
    case 0:
      return 'normal';
    case 1:
      return 'maximum';
    case 2:
      return 'fast';
    default:
      return 'super-fast';
  }
}

function equalBytes(bytes: Uint8Array, left: number, right: number, length: number): boolean {
  for (let index = 0; index < length; index++) {
    if (bytes[left + index] !== bytes[right + index]) return false;
  }
  return true;
}

function requireRange(
  offset: number,
  length: number,
  end: number,
  context: OperationContext,
  entryIndex?: number,
): void {
  const rangeEnd = checkedAdd(offset, length, context, entryIndex);
  if (offset < 0 || length < 0 || rangeEnd > end) fail(context, 'malformed', entryIndex);
}

function checkedAdd(
  left: number,
  right: number,
  context: OperationContext,
  entryIndex?: number,
): number {
  const value = left + right;
  if (!Num.Is.safeInt(value) || value < 0) fail(context, 'malformed', entryIndex);
  return value;
}

function failKnownRecord(
  view: DataView,
  offset: number,
  context: OperationContext,
  entryIndex?: number,
): never {
  if (offset + 4 <= view.byteLength) {
    const signature = u32(view, offset);
    if (
      signature === CENTRAL_DIGITAL_SIGNATURE ||
      signature === ARCHIVE_EXTRA_DATA ||
      signature === ZIP64_EOCD ||
      signature === ZIP64_LOCATOR
    ) {
      fail(context, 'unsupported', entryIndex);
    }
  }
  fail(context, 'malformed', entryIndex);
}

function fail(
  context: OperationContext,
  kind: t.Zip.Failure.Kind,
  entryIndex?: number,
): never {
  throw failure(context.operation, kind, {
    maxErrorChars: context.limits.maxErrorChars,
    entryIndex,
  });
}

function u16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function u32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function bitCount(value: number): number {
  let count = 0;
  while (value !== 0) {
    count += value & 1;
    value >>>= 1;
  }
  return count;
}

class ParseMeter {
  readonly #context: OperationContext;
  #bytes = 0;
  #records = 0;

  constructor(context: OperationContext) {
    this.#context = context;
  }

  async record(bytes: number, entryIndex?: number): Promise<void> {
    if (this.#records >= RECORD_QUANTUM) await this.#yield(entryIndex);
    this.#records++;
    await this.linear(bytes, entryIndex);
  }

  async linear(bytes: number, entryIndex?: number): Promise<void> {
    if (bytes < 0 || bytes > BYTE_QUANTUM) fail(this.#context, 'malformed', entryIndex);
    if (this.#bytes > 0 && this.#bytes + bytes > BYTE_QUANTUM) await this.#yield(entryIndex);
    this.#bytes += bytes;
    this.#context.checkpoint(entryIndex);
  }

  async complete(entryIndex?: number): Promise<void> {
    if (this.#records >= RECORD_QUANTUM || this.#bytes >= BYTE_QUANTUM) {
      await this.#yield(entryIndex);
    } else {
      this.#context.checkpoint(entryIndex);
    }
  }

  async #yield(entryIndex?: number): Promise<void> {
    this.#bytes = 0;
    this.#records = 0;
    await this.#context.yieldTurn(entryIndex);
  }
}
