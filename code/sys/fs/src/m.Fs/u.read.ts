import { type t, exists } from './common.ts';

/**
 * Asynchronously reads and returns the entire contents of a file as strongly-type JSON.
 */
export const readJson: t.FsReadJson = async <T>(path: string) => {
  type R = t.FsReadJsonResponse<T>;
  const targetExists = await exists(path);

  const fail = (errorReason: R['errorReason'], error: R['error']) => {
    return { ok: false, exists: targetExists, path, errorReason, error };
  };

  if (!targetExists) {
    const error = new Error(`JSON file does not exist at path: ${path}`);
    return fail('NotFound', error);
  }

  try {
    const text = await Deno.readTextFile(path);
    try {
      return {
        ok: true,
        exists: true,
        data: JSON.parse(text) as T,
        path,
      };
    } catch (error: any) {
      return fail('ParseError', error);
    }
  } catch (error: any) {
    return fail('Unknown', error);
  }
};
