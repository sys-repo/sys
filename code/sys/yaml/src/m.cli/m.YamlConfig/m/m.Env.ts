import { Env as BaseEnv } from '@sys/fs/env';
import { type t, Yaml } from '../common.ts';

/** Dotenv-backed YAML config env-ref helpers. */
export const Env: t.YamlConfig.Env.Lib = Object.freeze({
  async resolveAst(ast, options) {
    const env = await BaseEnv.load({ cwd: options.cwd, search: options.search ?? 'upward' });
    return Yaml.EnvRef.resolveAst(ast, {
      get: (name) => env.has(name) ? env.get(name) : undefined,
    });
  },
});
