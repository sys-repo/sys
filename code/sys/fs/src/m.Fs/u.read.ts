import { type t, exists, Path } from './common.ts';

/**
 * Asynchronously reads and returns the entire contents of a file
 * as strongly-typed, parsed JSON.
 */
export const readJson: t.FsReadJson = async <T>(path: string) => {
  const parse = JSON.parse;
  return readAndParse<T>({ path, parse, format: 'JSON' });
};

/**
 * Asynchronously reads and returns the entire contents of a file
 * as strongly-typed, parsed YAML.
 */
export const readYaml: t.FsReadYaml = async <T>(path: string) => {
  const { parse } = await import('yaml');
  return readAndParse<T>({ path, parse, format: 'YAML' });
};

/**
 * HELPERS
 */

export const readAndParse = async <T>(args: {
  path: string;
  parse: (text: string) => T;
  format: 'JSON' | 'YAML';
}) => {
  const { format } = args;

  type R = t.FsReadJsonResponse<T>;
  const path = Path.resolve(args.path);
  const targetExists = await exists(path);

  const fail = (errorReason: R['errorReason'], error: R['error']) => {
    return { ok: false, exists: targetExists, path, errorReason, error };
  };

  if (!targetExists) {
    const error = new Error(`${format} file does not exist at path: ${path}`);
    return fail('NotFound', error);
  }

  try {
    const text = await Deno.readTextFile(path);
    try {
      return {
        ok: true,
        exists: true,
        data: args.parse(text),
        path,
      };
    } catch (error: any) {
      return fail('ParseError', error);
    }
  } catch (error: any) {
    return fail('Unknown', error);
  }
};
