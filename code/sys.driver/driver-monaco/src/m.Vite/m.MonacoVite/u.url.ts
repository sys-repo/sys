import { Err, Str } from './common.ts';

/** Resolve an app-relative asset route from every Vite-supported base form. */
export function urlRoot(base: string, mount: string): string {
  try {
    const pathname = new URL(base || '/', 'http://vite.local/').pathname;
    const prefix = Str.trimTrailingSlashes(pathname);
    return `${prefix}/${mount}/`;
  } catch (cause) {
    throw Err.std(`Monaco asset contract failed: Invalid Vite base URL: ${base}.`, { cause });
  }
}
