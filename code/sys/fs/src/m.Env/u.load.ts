import * as DotEnv from '@std/dotenv';
import type { t } from './common.ts';

export const load: t.EnvLib['load'] = async () => {
  const dotenv = await DotEnv.load();
  const api: t.Env = {
    get(key) {
      return dotenv[key] || Deno.env.get(key) || '';
    },
  };
  return api;
};
