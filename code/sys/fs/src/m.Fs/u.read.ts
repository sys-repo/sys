import { type t, exists, Path, Err } from './common.ts';

/**
 * Asynchronously reads and returns the entire contents of a binary file (Uint8Array).
 */
export const read: t.FsReadBinary = async (path: string) => {
  return handleRead<Uint8Array>({ path, format: 'Binary' });
};

/**
 * Asynchronously reads and returns the entire contents of a text file.
 */
export const readText: t.FsReadText = async (path: string) => {
  const parse = (text: string) => text;
  return handleRead<string>({ path, parse, format: 'Text' });
};

/**
 * Asynchronously reads and returns the entire contents of a file
 * as strongly-typed, parsed JSON.
 */
export const readJson: t.FsReadJson = async <T>(path: string) => {
  const parse = JSON.parse;
  return handleRead<T>({ path, parse, format: 'JSON' });
};

/**
 * Asynchronously reads and returns the entire contents of a file
 * as strongly-typed, parsed YAML.
 */
export const readYaml: t.FsReadYaml = async <T>(path: string) => {
  const { parse } = await import('yaml');
  return handleRead<T>({ path, parse, format: 'YAML' });
};

/**
 * Helpers
 */

export const handleRead = async <T>(args: {
  format: 'JSON' | 'YAML' | 'Text' | 'Binary';
  path: string;
  parse?: (text: string) => T;
}) => {
  const { format } = args;

  type R = t.FsReadResult<T>;
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
    if (args.format === 'Binary') return success(binary as T);

    let text = '';
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      text = decoder.decode(binary);
    } catch (error: any) {
      return fail('DecodingError', Err.std(error));
    }

    try {
      if (!args.parse) return fail('DecodingError', Err.std('Internal: parser not specified'));
      return success(args.parse(text));
    } catch (error: any) {
      return fail('ParseError', Err.std(error));
    }
  } catch (error: any) {
    return fail('Unknown', Err.std(error));
  }
};
