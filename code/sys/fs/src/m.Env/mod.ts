/**
 * @module
 * Helpers for retrieveing environment variables (aka. "secrets").
 *
 * @example
 * ```ts
 * import { Env } from '@sys/fs/env';
 * const env = await Env.load();
 *
 * env.get('TEST_SAMPLE') //== "foobar"
 * ```
 */
import * as DotEnv from '@std/dotenv';
import type { t } from '../common.ts';

export const Env: t.EnvLib = {
  /**
   * Creates a reader for accessing env-vars.
   */
  async load() {
    const dotenv = await DotEnv.load();
    const api: t.Env = {
      get(key) {
        return dotenv[key] || Deno.env.get(key) || '';
      },
    };
    return api;
  },
};
