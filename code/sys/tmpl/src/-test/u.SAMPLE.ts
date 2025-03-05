import { type t, Fs, slug } from '../common.ts';

type Options = { slug?: boolean };

/**
 * Initialize a sample folder.
 */
function init(source: t.StringDir, options: Options = {}) {
  source = Fs.resolve(source);
  const randomDir = options.slug ?? true ? slug() : '';
  const target = Fs.resolve(`./.tmp/test/m.Tmpl`, randomDir);

  const exists = (dir: t.StringDir, path: string[]) => Fs.exists(Fs.join(dir, ...path));
  return {
    source,
    target,
    ls: {
      source: () => Fs.ls(source),
      target: () => Fs.ls(target),
    },
    exists: {
      source: (...path: string[]) => exists(source, path),
      target: (...path: string[]) => exists(target, path),
    },
  } as const;
}

/**
 * Test folder/file samples.
 */
export const SAMPLE = {
  init,
  sample1: (options?: Options) => init('./src/-test/sample-1', options),
  sample2: (options?: Options) => init('./src/-test/sample-2', options),
} as const;
