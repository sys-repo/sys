import { type t, Is as StdIs, isObject } from './common.ts';
import { markProxy } from './u.markProxy.ts';

type O = Record<string, unknown>;

/**
 * Flag helpers for Immutable objects.
 */
export const Is: t.ImmutableIsLib = {
  objectPath: StdIs.objectPath,

  proxy<T extends O>(input: any): input is T {
    if (!isObject(input)) return false;
    return markProxy.has(input);
  },

  immutable<D, P = unknown>(input: any): input is t.Immutable<D, P> {
    if (!isObject(input)) return false;
    const o = input as t.Immutable<D, P>;
    return isObject(o.current) && areFuncs(o.change);
  },

  immutableRef<D, P = unknown, E = unknown>(input: any): input is t.ImmutableRef<D, P, E> {
    if (!isObject(input)) return false;
    const o = input as t.ImmutableRef<D, E, P>;
    return Is.immutable(o) && typeof o.instance === 'string' && areFuncs(o.events);
  },

  readonlyImmutable<T>(input: unknown): input is t.ImmutableReadonly<T> {
    return isObject(input) && isObject((input as any).current);
  },

  readonlyImmutableRef<D, P = unknown, E = unknown>(
    input: unknown,
  ): input is t.ImmutableRefReadonly<D, P, E> {
    if (!isObject(input)) return false;
    const o = input as t.ImmutableRefReadonly<D, P, E>;
    return typeof o.instance === 'string' && areFuncs(o.events);
  },
} as const;

/**
 * Helpers:
 */
function areFuncs(...input: any[]) {
  return input.every((v) => typeof v === 'function');
}
