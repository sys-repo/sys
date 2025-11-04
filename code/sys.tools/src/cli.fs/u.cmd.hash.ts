import { type t, c, Cli, exclude, Fs, Hash, promptForFileSelection } from './common.ts';

/**
 * Captures: "sha256-" + 64 hex chars + optional extension.
 * Example match: "sha256-de48...ea5b7.mp4"
 */
const SHA256_FILE_RE = /(sha256-[a-f0-9]{64}(?:\.[\w.-]+)?)/i;

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
    await Fs.write(out, loaded.data, { force: true });

    res.push({ hx, in: path, out });

    const outShort = `${outFile.slice(0, 13)}..${c.green(hx.slice(-5))}${ext}`;
    table.push([c.gray(path.slice(dir.length)), '→', c.gray(outShort)]);
  }

  spinner.stop();
  console.info(table.toString());

  return res;
}

export async function extractSha256Files(dir: t.StringDir) {
  const glob = Fs.glob(dir, { exclude });
  const entries = await glob.find('*');

  const paths = entries
    .filter((e) => e.isFile)
    .map((e) => {
      const name = Fs.basename(e.path);
      const hashFile = sha256FileFromText(name) ?? sha256FileFromText(e.path);
      return hashFile ? { from: e.path, to: { filename: hashFile } } : undefined;
    })
    .filter((v): v is { from: t.StringPath; to: { filename: string } } => !!v);

  const outdir = Fs.join(dir, '-sha256');
  await Fs.ensureDir(outdir);

  const spinner = Cli.spinner();
  for (const path of paths) {
    await Fs.copy(path.from, Fs.join(outdir, path.to.filename), { force: true });
  }
  spinner.stop();

  return paths;
}
export const sha256FileFromText = (text: string): string | undefined => {
  const m = text.match(SHA256_FILE_RE);
  return m?.[1];
};
