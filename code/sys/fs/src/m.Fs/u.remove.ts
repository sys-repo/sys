import { type t, c, exists, Path } from './common.ts';

/**
 * Delete a directory (and it's contents).
 */
export const remove: t.Fs.Remove = async (path, options = {}) => {
  const targetExists = await exists(path);
  const shortPath = Path.trimCwd(path);

  if (options.dryRun) {
    const prefix = c.brightGreen(' dry run ');
    let line = `${prefix} ${c.cyan('delete')}: ${c.gray(shortPath)}`;
    if (!targetExists) line += c.yellow(' ← does not exist');
    console.info();
    console.info(line); // NB: dry-run always logs (otherwise no point).
    console.info();
    return targetExists;
  }

  if (!targetExists) return false;
  try {
    await wrangle.remove(path);
    if (options.log) console.info(`${c.cyan('deleted')} ${c.gray(shortPath)}`);
    return true;
  } catch (error: any) {
    if (error instanceof Deno.errors.NotFound) {
      return false; // NB: failure ignored - we are in the final desired state of no file.
    } else {
      throw error; // Re-throw the error to let the caller handle it.
    }
  }
};

const wrangle = {
  async remove(path: string) {
    const attempts = 4;

    for (let i = 0; i < attempts; i++) {
      try {
        await Deno.remove(path, { recursive: true });
        return;
      } catch (error) {
        if (!wrangle.isRetryable(error) || i === attempts - 1) throw error;
        await wrangle.sleep(25 * (i + 1));
      }
    }
  },

  isRetryable(error: unknown) {
    if (!(error instanceof Error)) return false;
    const text = error.message.toLowerCase();
    return text.includes('directory not empty') || text.includes('resource busy');
  },

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
} as const;
