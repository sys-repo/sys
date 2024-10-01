import { exists } from '@std/fs';
import type { t } from './common.ts';

/**
 * Asynchronously reads and returns the entire contents of a file as strongly-type JSON.
 */
export const readJson: t.ReadJson = async <T>(path: string) => {
  type R = t.ReadJsonResponse<T>;
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
        json: JSON.parse(text) as T,
        path,
      };
    } catch (error: any) {
      return fail('ParseError', error);
    }
  } catch (error: any) {
    return fail('Unknown', error);
  }
};
