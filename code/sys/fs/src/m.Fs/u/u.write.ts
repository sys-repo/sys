import { ensureDir, Err, Json, Path, type t } from '../common.ts';
import { stat } from './u.stat.ts';

/**
 * Writes a string or binary file ensuring it's parent directory exists.
 */
export const write: t.Fs.WriteFile = async (path, data, options = {}) => {
  const { force = true, throw: shouldThrow = false } = options;
  const errors = Err.errors();
  let overwritten = false;

  path = Path.resolve(path);
  try {
    await ensureDir(Path.dirname(path));
    const exists = (await stat(path)) !== undefined;

    if (exists && !force) {
      const err = `Failed to write because a file already exists at: ${path}`;
      if (shouldThrow) throw new Error(err);
      errors.push(err);
    } else {
      if (typeof data === 'string') {
        await Deno.writeTextFile(path, data);
      } else {
        await Deno.writeFile(path, data);
      }
      overwritten = exists;
    }
  } catch (cause: any) {
    if (shouldThrow) throw cause;
    errors.push(`Failed while writing file: ${path}`, cause);
  }

  const error = errors.toError();
  return {
    overwritten,
    error,
  };
};

/**
 * Writes a JSON serializable value to a string of JSON to a file.
 */
export const writeJson: t.Fs.WriteJson = async (path, data, options = {}) => {
  let json: string;
  try {
    json = Json.stringify(data, 2);
  } catch (cause: any) {
    const err = `Failed while serializing JSON to save to file: ${path}`;
    if (options.throw) throw new Error(err);
    return {
      overwritten: false,
      error: Err.std(err, { cause }),
    };
  }

  return await write(path, `${json}\n`, options);
};
