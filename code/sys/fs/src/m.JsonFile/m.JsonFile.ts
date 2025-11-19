/**
 * @module
 * Simple JSON based file-persitence with an ImmutableRef<T> handle API.
 */
import { type t } from './common.ts';
import { get } from './u.get.ts';
import { defaultDoc } from './u.ts';
import { Singleton } from './m.JsonFile.Singleton.ts';

/**
 * Simple JSON based file-persitence for configuration settings file.
 */
export const JsonFile: t.JsonFileLib = {
  Singleton,
  get,
  default: defaultDoc,
};
