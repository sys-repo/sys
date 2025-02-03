import { type t, exists, Path, Err } from './common.ts';

/**
 * Asynchronously reads and returns the entire contents of a file
 * as strongly-typed, parsed YAML.
 */
export const readText: t.FsReadText = async (path: string) => {
  const parse = (text: string) => text;
  return readAndParse<string>({ path, parse, format: 'Text' });
};

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
 * Helpers
 */

export const readAndParse = async <T>(args: {
  format: 'JSON' | 'YAML' | 'Text';
  path: string;
  parse: (text: string) => T;
}) => {
  const { format } = args;

  type R = t.FsReadResponse<T>;
  const path = Path.resolve(args.path);
  const targetExists = await exists(path);

  const success = (data: T) => ({ ok: true, exists: true, path, data });
  const fail = (errorReason: R['errorReason'], error: R['error']) => {
    return { ok: false, exists: targetExists, path, errorReason, error };
  };

  if (!targetExists) {
    const error = Err.std(`${format} file does not exist at path: ${path}`);
    return fail('NotFound', error);
  }

  try {
    const binary = await Deno.readFile(path);
    let text = '';

    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      text = decoder.decode(binary);
    } catch (error: any) {
      return fail('DecodingError', Err.std(error));
    }

    try {
      return success(args.parse(text));
    } catch (error: any) {
      return fail('ParseError', Err.std(error));
    }
  } catch (error: any) {
    return fail('Unknown', Err.std(error));
  }
};
