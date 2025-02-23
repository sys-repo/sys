import { type t, Delete, Err, Path } from './common.ts';
import { Is } from './m.Is.ts';

type R = t.ViteConfigFromFile;

/**
 * Attempts to dynamically load a `vite.config.ts` module.
 */
export const fromFile: t.ViteConfigLib['fromFile'] = async (input) => {
  const errors = Err.errors();
  const path = wrangle.path(input);
  const res = await loadModule(path, errors);
  return {
    path,
    exists: res.exists,
    module: wrangle.module(res.mod),
    error: errors.toError(),
  };
};

/**
 * Helpers
 */
async function loadModule(path: string, errors: t.ErrorCollection) {
  let exists = false;
  path = `file://${path.replace(/^file\:\/\//, '')}`;
  try {
    const mod = await import(path);
    exists = true;
    return { mod, exists };
  } catch (cause: unknown) {
    const unexpected = `Unexpected error while importing module from path: ${path}`;
    if (!(cause instanceof Error)) {
      errors.push(unexpected);
    } else {
      if (cause.message.includes('Module not found')) {
        exists = false;
        errors.push(`Module not found at path: ${path}`, cause);
      } else {
        errors.push(unexpected, cause);
      }
    }
    return { exists };
  }
}

const wrangle = {
  path(input?: string): t.StringAbsolutePath {
    return typeof input === 'string' ? Path.resolve(input) : Path.resolve('vite.config.ts');
  },
  module(mod: any): R['module'] {
    const defineConfig = typeof mod?.default === 'function' ? mod.default : undefined;
    const paths = Is.paths(mod?.paths) ? mod.paths : undefined;
    return Delete.undefined({ defineConfig, paths });
  },
} as const;
