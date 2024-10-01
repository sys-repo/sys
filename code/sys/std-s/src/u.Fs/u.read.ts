import { exists } from '@std/fs';
import type { t } from './common.ts';

/**
 * Asynchronously reads and returns the entire contents of a file as strongly-type JSON.
 */
export const readJsonFile: t.ReadJsonFile = async <T>(path: string) => {
  type R = t.ReadJsonFileResponse<T>;

  const fail = (error: R['error'], errorReason: R['errorReason']) => {
    return { ok: false, path, errorReason, error };
  };

  if (!(await exists(path))) {
    const error = new Error(`JSON file does not exist at path: ${path}`);
    return fail(error, 'NotFound');
  }

  try {
    const text = await Deno.readTextFile(path);
    try {
      return { ok: true, path, json: JSON.parse(text) as T };
    } catch (error: any) {
      return fail(error, 'ParseError');
    }
  } catch (error: any) {
    return fail(error, 'Unknown');
  }
};
