/**
 * @module
 * Simple JSON based file-persitence with an ImmutableRef<T> handle API.
 */
import { type t } from './common.ts';
import { get } from './u.get.ts';
import { getter } from './u.getter.ts';
import { defaultDoc } from './u.ts';

/**
 * Simple JSON based file-persitence for configuration settings file.
 */
export const JsonFile: t.JsonFileLib = {
  getter,
  get,
  default: defaultDoc,
};
