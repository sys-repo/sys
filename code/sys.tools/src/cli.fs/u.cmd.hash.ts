import { type t, c, Cli, Fs, Hash, promptForFileSelection, Time } from './common.ts';

export async function selectFilesAndRenameToHash(dir: t.StringDir) {
  type T = { hx: string; in: t.StringPath; out: t.StringPath };
  const res: T[] = [];

  const table = Cli.table([]);
  const files = await promptForFileSelection(dir, { filter: (e) => !e.name.includes('→ sha256-') });
  const spinner = Cli.spinner();

  for (const path of files) {
    const dir = Fs.dirname(path);
    const filename = Fs.basename(path);
    const ext = Fs.extname(filename);

    const loaded = await Fs.read(path);
    if (loaded.error || !loaded.ok || !loaded.data) {
      throw new Error(`Failed to load file: ${path}`, { cause: loaded.error });
    }

    const hx = Hash.sha256(loaded.data);
    const outFile = `${hx}${ext}`;
    const outAppended = `${filename} → ${outFile}`;
    const out = Fs.join(dir, outAppended);
    await Fs.write(out, loaded.data);

    res.push({ hx, in: path, out });

    const outShort = `${outFile.slice(0, 13)}..${c.green(hx.slice(-5))}${ext}`;
    table.push([c.gray(path.slice(dir.length)), '→', c.gray(outShort)]);
  }

  spinner.stop();
  console.info(table.toString());

  return res;
}
