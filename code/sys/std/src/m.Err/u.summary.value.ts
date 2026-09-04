import { Is, Str } from './common.ts';

const DIAGNOSTIC_KEYS = [
  'code',
  'errno',
  'syscall',
  'status',
  'statusCode',
  'statusText',
  'port',
] as const;
const MAX_DIAGNOSTIC_VALUE = 80;

export type ErrorRecord = Record<string, unknown> & { readonly message: string };

/** Predicate for structured error-like records that are not native Error instances. */
export function isErrorRecord(value: unknown): value is ErrorRecord {
  return Is.record(value) && Is.str(value.message);
}

/** Resolve a stable display name for an error-like record. */
export function errorRecordName(value: ErrorRecord) {
  return Is.str(value.name) && value.name.length > 0 ? value.name : 'Error';
}

/** Render non-error values without falling through to `[object Object]`. */
export function valueSummary(value: unknown) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Is.str(value)) return value;
  if (Is.num(value) || Is.bool(value) || typeof value === 'bigint') return String(value);
  if (typeof value === 'symbol') return String(value);
  if (Is.func(value)) return 'Function';
  if (Is.array(value)) return `Array(${value.length})`;
  if (Is.record(value)) return `${objectTag(value)}${metadata(value)}`;
  return String(value);
}

/** Render whitelisted diagnostic fields only, with bounded values. */
export function metadata(value: object) {
  const fields = DIAGNOSTIC_KEYS
    .map((key) => formatDiagnosticField(key, value))
    .filter((field) => field.length > 0);
  return fields.length > 0 ? ` (${fields.join(', ')})` : '';
}

/**
 * Helpers:
 */
function objectTag(value: object) {
  const tag = Object.prototype.toString.call(value).slice(8, -1);
  return tag || 'Object';
}

function formatDiagnosticField(key: string, value: object) {
  const item: unknown = Reflect.get(value, key);
  const text = diagnosticValue(item);
  return text ? `${key}=${text}` : '';
}

function diagnosticValue(value: unknown) {
  if (Is.nil(value)) return '';
  if (!Is.str(value) && !Is.num(value) && !Is.bool(value) && typeof value !== 'bigint') return '';

  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? Str.truncate(text, MAX_DIAGNOSTIC_VALUE) : '';
}
