import { Fs, Json, Path, type t } from './common.ts';

/**
 * Load a `deno.json` file at the given file path.
 */
export const load: t.DenoFile.Lib['load'] = async (path) => {
  path = Path.resolve(path ?? './deno.json');
  if (await Fs.Is.dir(path)) {
    const json = Fs.join(path, 'deno.json');
    const jsonc = Fs.join(path, 'deno.jsonc');
    if (await Fs.exists(json)) path = json;
    else if (await Fs.exists(jsonc)) path = jsonc;
    else path = json;
  }

  if (!path.endsWith('.jsonc')) {
    return Fs.readJson<t.DenoFile.Json>(path);
  }

  const res = await Fs.readText(path);
  if (!res.ok) {
    return {
      ok: false,
      exists: res.exists,
      path: res.path,
      errorReason: res.errorReason,
      error: res.error,
    };
  }

  const parsed = Json.safeParse<t.DenoFile.Json>(res.data, {}, { jsonc: true });
  if (!parsed.ok) {
    return {
      ok: false,
      exists: true,
      path: res.path,
      errorReason: 'ParseError',
      error: parsed.error,
    };
  }

  return { ok: true, exists: true, path: res.path, data: parsed.data };
};
