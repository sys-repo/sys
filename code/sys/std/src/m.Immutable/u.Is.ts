import { type t, Symbols, isObject } from './common.ts';

type O = Record<string, unknown>;

/**
 * Flag helpers for Immutable objects.
 */
export const Is: t.ImmutableIsLib = {
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

  map<T extends O, P = unknown>(input: any): input is t.ImmutableMap<T, P> {
    return isObject(input) && Symbols.map.root in input;
  },

  proxy<T extends O>(input: any): input is T {
    if (!isObject(input)) return false;
    return isObject(input) && Symbols.map.proxy in input;
  },
} as const;

/**
 * Helpers
 */
function areFuncs(...input: any[]) {
  return input.every((v) => typeof v === 'function');
}
