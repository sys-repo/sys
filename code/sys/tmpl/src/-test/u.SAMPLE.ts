import { type t, Fs, slug } from '../common.ts';

type Options = { slug?: boolean };

/**
 * Test folder/file samples.
 */
export const SAMPLE = {
  fs(namespace: string) {
    const target = Fs.join('./.tmp', namespace);
    return {
      sample1: (options?: Options) => init('./src/-test/sample-1', target, options),
      sample2: (options?: Options) => init('./src/-test/sample-2', target, options),
    } as const;
  },
} as const;

/**
 * Initialize a test folder.
 */
function init(source: t.StringDir, target: t.StringDir, options: Options = {}) {
  const randomDir = options.slug ?? true ? slug() : '';
  source = Fs.resolve(source);
  target = Fs.resolve(target, randomDir);

  const exists = (dir: t.StringDir, path: t.StringPath[]) => Fs.exists(Fs.join(dir, ...path));
  return {
    source,
    target,
    ls: {
      source: () => Fs.ls(source),
      target: () => Fs.ls(target),
    },
    exists: {
      source: (...path: t.StringPath[]) => exists(source, path),
      target: (...path: t.StringPath[]) => exists(target, path),
    },
  } as const;
}
