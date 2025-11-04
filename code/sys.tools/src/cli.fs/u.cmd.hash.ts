import { WalkEntry } from '../common/t.ts';
import { type t, c, Cli, EXCLUDE, Fs, Hash, promptForFileSelection } from './common.ts';

/**
 * Captures: "sha256-" + 64 hex chars + optional extension.
 * Example match: "sha256-de48...ea5b7.mp4"
 */
const SHA256_FILE_RE = /(sha256-[a-f0-9]{64}(?:\.[\w.-]+)?)/i;

/**
 * Prompts the user to select files and renames each
 * to its SHA-256 hash with extension.
 */
export async function selectFilesAndRenameToHash(dir: t.StringDir) {
  type T = { hx: string; in: t.StringPath; out: t.StringPath };
  const res: T[] = [];

  const table = Cli.table([]);
  const files = await promptForFileSelection(dir, {
    deep: false,
    filter: (e) => !e.name.includes('→ sha256-'),
  });
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
    table.push(['', c.gray(path.slice(dir.length)), '→', c.gray(outShort)]);
  }

  spinner.stop();
  console.info(table.toString());

  return res;
}

/**
 * Scans a directory for files named with a SHA-256 pattern and
 * copies them into a "-sha256" folder.
 */
export async function extractSha256Files(dir: t.StringDir) {
  const paths = await getRenamedFilePaths(dir);
  const outdir = Fs.join(dir, '-sha256');
  await Fs.ensureDir(outdir);

  const spinner = Cli.spinner();
  for (const path of paths) {
    const to = Fs.join(outdir, path.to.filename);
    await Fs.copy(path.from, to, { force: true });
  }
  spinner.stop();

  return paths;
}

/**
 *
 */
export async function removeRenamedSh256Files(dir: t.StringDir, opts: { dryRun?: boolean } = {}) {
  const { dryRun = false } = opts;
  const paths = await getRenamedFilePaths(dir);

  // Confirm:
  console.info();
  console.info(c.gray(`About to ${c.yellow('delete')} files:`));
  console.info();
  paths.forEach((e) => console.info(c.gray(` • ${Fs.basename(e.from)}`)));
  console.info();

  const yes = await Cli.Prompt.Confirm.prompt('Are you sure?');
  if (!yes) return;

  for (const path of paths) {
    await Fs.remove(path.from, { dryRun, log: true });
  }
}

/**
 * Helpers:
 */
async function getRenamedFilePaths(dir: t.StringDir) {
  const glob = Fs.glob(dir, { exclude: EXCLUDE });
  const entries = await glob.find('*');

  type TFile = { from: t.StringPath; to: { filename: t.StringName } };
  const mapFile = (e: WalkEntry) => {
    const name = Fs.basename(e.path);
    const hashName = sha256FileFromText(name) ?? sha256FileFromText(e.path);
    return hashName ? { from: e.path, to: { filename: hashName } } : undefined;
  };

  return entries
    .filter((e) => e.isFile)
    .map(mapFile)
    .filter((v): v is TFile => !!v);
}

function sha256FileFromText(text: string): string | undefined {
  const m = text.match(SHA256_FILE_RE);
  return m?.[1];
}
