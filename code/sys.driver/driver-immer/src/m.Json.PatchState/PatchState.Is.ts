import { Patch } from '../m.Json.Patch/mod.ts';
import type { t } from './common.ts';

export const Is: t.PatchStateIsLib = {
  state(input: any): input is t.PatchState<any> {
    if (input === null || typeof input !== 'object') return false;
    if (typeof input.instance !== 'string') return false;
    if (typeof input.change !== 'function') return false;
    if (typeof input.events !== 'function') return false;
    const descriptor = Object.getOwnPropertyDescriptor(input, 'current');
    return !!descriptor && typeof descriptor.get === 'function';
  },

  /**
   * Determine if the given object is a [PatchState] of the specified type.
   */
  type(input: any, typename: string): input is t.PatchState<any> {
    if (!Is.state(input)) return false;
    return input.typename === typename;
  },

  /**
   * Determine if the given object is a "proxy/draft" that is
   * currently being edited within a change function.
   */
  proxy(input: any): boolean {
    return Patch.isProxy(input);
  },
} as const;
