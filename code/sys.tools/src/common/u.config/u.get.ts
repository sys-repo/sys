import { type t, Fs, JsonFile } from './common.ts';

export async function get<Doc extends t.JsonFileDoc>(
  cwd: t.StringDir,
  filename: string,
  initial: Doc,
): Promise<t.JsonFile<Doc>> {
  const path = Fs.join(cwd, filename);
  const doc = JsonFile.Singleton.get<Doc>(path, initial, { touch: true });
  return doc;
}
