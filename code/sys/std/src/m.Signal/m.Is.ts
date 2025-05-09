import { Signal } from '@preact/signals-core';
import { type t, isObject } from './common.ts';

export const Is: t.SignalIsLib = {
  signal<T = unknown>(input: unknown): input is t.Signal<T> {
    if (input instanceof Signal) return true;
    const value = input as t.Signal<T>;
    return isObject(value) && 'value' in value && typeof value.peek === 'function';
  },
};
