import { Fs } from '../../common.ts';

/**
 * Run a function inside a temporary directory.
 * The directory is created before execution and always removed after.
 */
export async function withTmpDir<T>(
  fn: (dir: string) => Promise<T>,
  options: { readonly prefix?: string } = {},
): Promise<T> {
  const { prefix = 'sys.tools.serve.' } = options;
  const dir = await Fs.makeTempDir({ prefix });
  try {
    return await fn(dir.absolute);
  } finally {
    await Fs.remove(dir.absolute);
  }
}
