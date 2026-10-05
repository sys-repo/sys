import { Err, Fs, type t } from '../common.ts';

type WithTmpDir = t.TestingServerLib['withTmpDir'];
type Options = NonNullable<Parameters<WithTmpDir>[1]>;
type Io = Readonly<Pick<typeof Fs, 'makeTempDir' | 'realPath' | 'remove'>>;
type Execution<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: unknown };

/**
 * Pass a fresh canonical temporary-directory path to a callback; await cleanup before settlement.
 */
export const withTmpDir: WithTmpDir = createWithTmpDir({
  makeTempDir: Fs.makeTempDir,
  realPath: Fs.realPath,
  remove: Fs.remove,
});

/** Internal filesystem binding seam for deterministic lifetime tests; not a public barrel export. */
export function createWithTmpDir(io: Io): WithTmpDir {
  return async <T>(
    fn: (dir: t.StringAbsoluteDir) => T,
    options: Options = {},
  ): Promise<Awaited<T>> => {
    const { prefix = 'sys.testing.' } = options;
    const dir = await io.makeTempDir({ prefix });
    let execution: Execution<Awaited<T>>;
    try {
      const canonical = await io.realPath(dir.absolute);
      execution = { ok: true, value: await fn(canonical) };
    } catch (error) {
      execution = { ok: false, error };
    }

    try {
      await io.remove(dir.absolute);
    } catch (error) {
      if (!execution.ok) {
        const err = 'Temporary-directory execution and cleanup failed.';
        throw Err.std(err, { errors: [execution.error, error] });
      }
      throw error;
    }

    if (!execution.ok) throw execution.error;
    return execution.value;
  };
}
