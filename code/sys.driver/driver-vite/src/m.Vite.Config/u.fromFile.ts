import { type t, Delete, Err, isRecord, Path } from './common.ts';
import { Is } from './m.Is.ts';

type R = t.ViteConfigFromFile;

/**
 * Attempts to dynamically load a `vite.config.ts` module.
 */
export const fromFile: t.ViteConfigLib['fromFile'] = async (input) => {
  const path = wrangle.path(input);
  const errors = Err.errors();
  const mod = await loadModule(path, errors);
  const module = wrangle.module(mod);
  return {
    path,
    module,
    error: errors.toError(),
  };
};

/**
 * Helpers
 */
async function loadModule(path: string, errors: t.ErrorCollection) {
  try {
    return await import(path);
  } catch (cause: unknown) {
    const unexpected = `Unexpected error while importing module from path: ${path}`;
    if (cause instanceof Error) {
      console.log('cause', cause?.message);
      if (cause.message.includes('Module not found')) {
        errors.push(`Module not found at path: ${path}`, cause);
      } else {
        errors.push(unexpected, cause);
      }
    } else {
      errors.push(unexpected);
    }
  }
}

const wrangle = {
  path(input?: string) {
    return typeof input === 'string' ? Path.resolve(input) : Path.resolve('vite.config.ts');
  },
  module(mod: any): R['module'] {
    const defineConfig = typeof mod?.default === 'function' ? mod.default : undefined;
    const paths = Is.paths(mod?.paths) ? mod.paths : undefined;
    return Delete.undefined({ defineConfig, paths });
  },
} as const;
