import * as DotEnv from '@std/dotenv';
import type { t } from '../common/mod.ts';

/**
 * Helpers for retrieveing environment variables (aka. "secrets").
 */
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
