import { Err, Fs, type t } from '../common.ts';

/**
 * Pass a fresh canonical temporary-directory path to a callback; await cleanup before settlement.
 */
export const withTmpDir: t.TestingServer.WithTmpDir = createWithTmpDir({
  makeTempDir: Fs.makeTempDir,
  realPath: Fs.realPath,
  remove: Fs.remove,
});

/** Internal filesystem binding seam for deterministic lifetime tests; not a public barrel export. */
export function createWithTmpDir(io: t.TestingServer.WithTmpDir.Io): t.TestingServer.WithTmpDir {
  return async <T>(
    fn: (dir: t.StringAbsoluteDir) => T,
    options: t.TestingServer.WithTmpDir.Options = {},
  ): Promise<Awaited<T>> => {
    const { prefix = 'sys.testing.' } = options;
    const dir = await io.makeTempDir({ prefix });
    let execution: t.TestingServer.WithTmpDir.Execution<Awaited<T>>;
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
