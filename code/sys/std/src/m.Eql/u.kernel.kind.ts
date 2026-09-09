import {
  ARRAY_BUFFER_BYTE_LENGTH_GET,
  ARRAY_BUFFER_VIEW_PROTOTYPES,
  DATE_GET_TIME,
  MAP_SIZE_GET,
  REGEXP_GLOBAL_GET,
  REGEXP_SOURCE_GET,
  SET_SIZE_GET,
} from './u.kernel.intrinsics.ts';
import type { ValueKind } from './t.kernel.ts';

/**
 * Domain classification for the equality kernel.
 *
 * Anything outside this explicit pure-data domain is opaque and therefore only
 * equal by identity via the top-level `Object.is` check.
 */
export function valueKind(value: object): ValueKind {
  const proto = Object.getPrototypeOf(value);
  if (Array.isArray(value)) return proto === Array.prototype ? 'array' : 'opaque';
  if (proto === Date.prototype) return hasDateBrand(value) ? 'date' : 'opaque';
  if (proto === RegExp.prototype) return hasRegExpBrand(value) ? 'regexp' : 'opaque';
  if (ArrayBuffer.isView(value)) {
    return isSupportedArrayBufferView(value) ? 'array-buffer-view' : 'opaque';
  }
  if (proto === ArrayBuffer.prototype) {
    return hasArrayBufferBrand(value) ? 'array-buffer' : 'opaque';
  }
  if (proto === Map.prototype) return hasMapBrand(value) ? 'map' : 'opaque';
  if (proto === Set.prototype) return hasSetBrand(value) ? 'set' : 'opaque';
  return isPlainRecord(value) ? 'record' : 'opaque';
}

export function isObjectLike(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function hasDateBrand(value: object): boolean {
  try {
    DATE_GET_TIME.call(value as Date);
    return true;
  } catch {
    return false;
  }
}

function hasRegExpBrand(value: object): boolean {
  try {
    REGEXP_SOURCE_GET.call(value as RegExp);
    REGEXP_GLOBAL_GET.call(value as RegExp);
    return true;
  } catch {
    return false;
  }
}

function hasArrayBufferBrand(value: object): boolean {
  try {
    ARRAY_BUFFER_BYTE_LENGTH_GET.call(value as ArrayBuffer);
    return true;
  } catch {
    return false;
  }
}

function hasMapBrand(value: object): boolean {
  try {
    MAP_SIZE_GET.call(value as Map<unknown, unknown>);
    return true;
  } catch {
    return false;
  }
}

function hasSetBrand(value: object): boolean {
  try {
    SET_SIZE_GET.call(value as Set<unknown>);
    return true;
  } catch {
    return false;
  }
}

function isSupportedArrayBufferView(value: ArrayBufferView): boolean {
  return ARRAY_BUFFER_VIEW_PROTOTYPES.has(Object.getPrototypeOf(value));
}

function isPlainRecord(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
