import { type t, Fs, Hash, promptForFileSelection } from './common.ts';

export async function selectFilesAndRenameToHash(dir: t.StringDir) {
  type T = { hx: string; in: t.StringPath; out: t.StringPath };
  const res: T[] = [];

  const files = await promptForFileSelection(dir);

  for (const path of files) {
    const dir = Fs.dirname(path);
    const filename = Fs.basename(path);
    const ext = Fs.extname(filename);

    const loaded = await Fs.read(path);
    if (loaded.error || !loaded.ok || !loaded.data) {
      throw new Error(`Failed to load file: ${path}`, { cause: loaded.error });
    }

    const hx = Hash.sha256(loaded.data);
    const out = Fs.join(dir, `${hx}${ext}`);
    await Fs.write(out, loaded.data);

    res.push({ hx, in: path, out });
  }

  return res;
}
