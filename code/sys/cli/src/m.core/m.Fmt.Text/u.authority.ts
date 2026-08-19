import { isTerminalAuthorityReady } from '../m.Is/u.terminal.ts';
import { isScreenMeasurementAuthorityReady } from '../m.Screen/u.platform.ts';
import {
  type AuthoritySnapshot,
  createSynchronousAuthority,
  snapshotProperty,
  snapshotShape,
  snapshotsReady,
} from '../u/u.authority.ts';

const NativeArray = Array;
const NativeError = Error;
const NativeIntl = Intl;
const NativeMath = Math;
const NativeNumber = Number;
const NativeObject = Object;
const NativeRegExp = RegExp;
const NativeSegmenter = NativeIntl.Segmenter;
const NativeString = String;
const NativeSymbol = Symbol;
const apply = Reflect.apply;
const freeze = NativeObject.freeze;
const getOwnPropertyDescriptor = NativeObject.getOwnPropertyDescriptor;
const getPrototypeOf = NativeObject.getPrototypeOf;
const iteratorKey = NativeSymbol.iterator;
const replaceKey = NativeSymbol.replace;

const arrayJoin = dataFunction(NativeArray.prototype, 'join');
const arrayPush = dataFunction(NativeArray.prototype, 'push');
const mathAbs = dataFunction(NativeMath, 'abs');
const mathFloor = dataFunction(NativeMath, 'floor');
const mathMax = dataFunction(NativeMath, 'max');
const mathMin = dataFunction(NativeMath, 'min');
const numberIsFinite = dataFunction(NativeNumber, 'isFinite');
const regexpExec = dataFunction(NativeRegExp.prototype, 'exec');
const regexpReplace = dataFunction(NativeRegExp.prototype, replaceKey);
const stringFromCodePoint = dataFunction(NativeString, 'fromCodePoint');
const stringCharCodeAt = dataFunction(NativeString.prototype, 'charCodeAt');
const stringCodePointAt = dataFunction(NativeString.prototype, 'codePointAt');
const stringIncludes = dataFunction(NativeString.prototype, 'includes');
const stringRepeat = dataFunction(NativeString.prototype, 'repeat');
const stringSlice = dataFunction(NativeString.prototype, 'slice');
const stringSplit = dataFunction(NativeString.prototype, 'split');
const stringStartsWith = dataFunction(NativeString.prototype, 'startsWith');
const stringTrim = dataFunction(NativeString.prototype, 'trim');
const stringTrimStart = dataFunction(NativeString.prototype, 'trimStart');

const segmenterPrototype = NativeSegmenter.prototype;
const segment = dataFunction(segmenterPrototype, 'segment');
const segmenter = new NativeSegmenter(undefined, { granularity: 'grapheme' });
const segments = apply(segment, segmenter, ['authority']);
const segmentsPrototype = getPrototypeOf(segments);
const segmentsIterator = dataFunction(segmentsPrototype, iteratorKey);
const segmentIterator = apply(segmentsIterator, segments, []);
const segmentIteratorPrototype = getPrototypeOf(segmentIterator);
const segmentIteratorNext = dataFunction(segmentIteratorPrototype, 'next');
const stringIterator = dataFunction(NativeString.prototype, iteratorKey);
const stringIteratorPrototype = getPrototypeOf(apply(stringIterator, '', []));

// Whole-owner shapes make runtime upgrades explicit and prevent an open-ended method inventory.
const snapshots = freeze(
  [
    snapshotProperty(globalThis, 'Object'),
    snapshotProperty(globalThis, 'Array'),
    snapshotProperty(globalThis, 'Error'),
    snapshotProperty(globalThis, 'Intl'),
    snapshotProperty(globalThis, 'Math'),
    snapshotProperty(globalThis, 'Number'),
    snapshotProperty(globalThis, 'RegExp'),
    snapshotProperty(globalThis, 'String'),
    snapshotProperty(globalThis, 'Symbol'),
    snapshotProperty(NativeIntl, 'Segmenter'),
    snapshotShape(NativeObject),
    snapshotShape(NativeObject.prototype),
    snapshotShape(NativeArray),
    snapshotShape(NativeArray.prototype),
    snapshotShape(NativeError),
    snapshotShape(NativeError.prototype),
    snapshotShape(NativeMath),
    snapshotShape(NativeNumber),
    snapshotShape(NativeNumber.prototype),
    snapshotShape(NativeRegExp),
    snapshotShape(NativeRegExp.prototype),
    snapshotShape(NativeString),
    snapshotShape(NativeString.prototype),
    snapshotShape(NativeSymbol),
    snapshotShape(NativeSymbol.prototype),
    snapshotShape(NativeIntl),
    snapshotShape(NativeSegmenter),
    snapshotShape(segmenterPrototype),
    snapshotShape(segmentsPrototype),
    snapshotShape(segmentIteratorPrototype),
    snapshotShape(stringIteratorPrototype),
  ] satisfies readonly AuthoritySnapshot[],
);

const authority = createSynchronousAuthority(
  'Cli.Fmt.Text presentation authority unavailable.',
  [
    () => snapshotsReady(snapshots),
    isTerminalAuthorityReady,
    isScreenMeasurementAuthorityReady,
  ],
);

/**
 * Whether the complete terminal-text substrate still matches its trusted module-initialization
 * baseline. This is an integrity monitor after import, not native-identity recovery after poisoning.
 */
export const isTextPresentationAuthorityReady = authority.isReady;

/** Refuse terminal-text formatting before dispatching through changed presentation authority. */
export const assertTextPresentationAuthority = authority.assert;

/** Re-admit around one caller-owned synchronous read or callback. */
export const runTextPresentationAuthority = authority.run;

/** Captured operations used by owned terminal-text algorithms after admission. */
export const TextIntrinsic = freeze({
  arrayJoin(input: readonly unknown[], separator: string): string {
    return apply(arrayJoin, input, [separator]) as string;
  },
  arrayPush<T>(input: T[], value: T): number {
    return apply(arrayPush, input, [value]) as number;
  },
  freeze<T extends object>(input: T): Readonly<T> {
    return freeze(input);
  },
  regexpExec(pattern: RegExp, input: string): RegExpExecArray | null {
    return apply(regexpExec, pattern, [input]) as RegExpExecArray | null;
  },
  regexpReplace(pattern: RegExp, input: string, replacement: string): string {
    return apply(regexpReplace, pattern, [input, replacement]) as string;
  },
  forEachSegment(
    input: string,
    visit: (segment: string) => boolean | void,
  ): void {
    const source = apply(segment, segmenter, [input]);
    const iterator = apply(segmentsIterator, source, []);
    while (true) {
      const step = apply(segmentIteratorNext, iterator, []) as IteratorResult<{
        readonly segment: string;
      }>;
      if (step.done || visit(step.value.segment) === false) break;
    }
  },
  stringCharCodeAt(input: string, index: number): number {
    return apply(stringCharCodeAt, input, [index]) as number;
  },
  stringCodePointAt(input: string, index: number): number | undefined {
    return apply(stringCodePointAt, input, [index]) as number | undefined;
  },
  stringFromCodePoint(codePoint: number): string {
    return apply(stringFromCodePoint, NativeString, [codePoint]) as string;
  },
  stringIncludes(input: string, value: string): boolean {
    return apply(stringIncludes, input, [value]) as boolean;
  },
  stringRepeat(input: string, count: number): string {
    return apply(stringRepeat, input, [count]) as string;
  },
  stringSlice(input: string, start: number, end?: number): string {
    return apply(stringSlice, input, [start, end]) as string;
  },
  stringSplit(input: string, separator: string): string[] {
    return apply(stringSplit, input, [separator]) as string[];
  },
  stringStartsWith(input: string, value: string): boolean {
    return apply(stringStartsWith, input, [value]) as boolean;
  },
  stringTrim(input: string): string {
    return apply(stringTrim, input, []) as string;
  },
  stringTrimStart(input: string): string {
    return apply(stringTrimStart, input, []) as string;
  },
  numberIsFinite(input: number): boolean {
    return apply(numberIsFinite, NativeNumber, [input]) as boolean;
  },
});

/** Captured numeric operations used by terminal-text layout after admission. */
export const TextNumeric = freeze({
  abs(input: number): number {
    return apply(mathAbs, NativeMath, [input]) as number;
  },
  floor(input: number): number {
    return apply(mathFloor, NativeMath, [input]) as number;
  },
  max(left: number, right: number): number {
    return apply(mathMax, NativeMath, [left, right]) as number;
  },
  min(left: number, right: number): number {
    return apply(mathMin, NativeMath, [left, right]) as number;
  },
});

function dataFunction(target: object, key: PropertyKey): (...args: never[]) => unknown {
  const descriptor = getOwnPropertyDescriptor(target, key);
  if (!descriptor || !('value' in descriptor) || typeof descriptor.value !== 'function') {
    throw new NativeError('Cli.Fmt.Text presentation authority unavailable.');
  }
  return descriptor.value;
}
