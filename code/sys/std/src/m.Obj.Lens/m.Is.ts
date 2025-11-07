import { type t, isRecord, Path } from './common.ts';

export const Is: t.ObjLensIsLib = {
  lens: isLensUnbound,
  lensRef: isLensRefAny,
  lensRefReadonly: isLensRefReadonly,
  lensRefWritable: isLensRefWritable,
  readonly: (v?: unknown): boolean => isLensRefReadonly(v),
};

function isLensRefAny(
  v: unknown,
): v is t.ReadonlyObjLensRef<any, unknown> | t.ObjLensRef<any, unknown> {
  if (!isRecord(v)) return false;
  if (!('subject' in v)) return false;
  if (!('path' in v)) return false;
  const o = v as Record<string, unknown>;
  if (!Path.Is.path(o.path)) return false;
  if (!hasFn(o, 'get') || !hasFn(o, 'exists') || !hasFn(o, 'at')) return false;
  return true;
}

function isLensRefWritable(v: unknown): v is t.ObjLensRef<any, unknown> {
  if (!isLensRefAny(v)) return false;
  const o = v as Record<string, unknown>;
  // Writable lens typically exposes mutators; RO does not.
  return hasFn(o, 'set') || hasFn(o, 'delete') || hasFn(o, 'ensure');
}

function isLensRefReadonly(v: unknown): v is t.ReadonlyObjLensRef<any, unknown> {
  return isLensRefAny(v) && !isLensRefWritable(v);
}

function isLensUnbound(v: unknown): v is t.ObjLens<unknown> {
  // Unbound lenses are builders: have .bind but no .subject.
  if (!isRecord(v)) return false;
  const o = v as Record<string, unknown>;
  if (!hasFn(o, 'bind')) return false;
  // Bound refs carry .subject; ensure unbound by absence.
  if ('subject' in o) return false;
  // Curried path utilities likely exist, but we avoid over-constraining.
  return true;
}

/**
 * Helpers:
 */
export const hasFn = (o: Record<string, unknown>, k: string): boolean => typeof o[k] === 'function';
