import { WalkEntry } from '../common/t.ts';
import { type t, c, Cli, EXCLUDE, Fs, Hash, promptFileSelection, Str } from './common.ts';

/**
 * Captures: "sha256-" + 64 hex chars + optional extension.
 * Example match: "sha256-de48...ea5b7.mp4"
 */
const SHA256_FILE_RE = /(sha256-[a-f0-9]{64}(?:\.[\w.-]+)?)/i;

/**
 * List files within the directory showing their SHA-256 hash next to their filename.
 */
export async function listFileHashes(cwd: t.StringDir) {
  const entries = (await listFiles(cwd, { depth: 3 })).filter((m) => !isSha256File(m.name));
  if (entries.length === 0) {
    console.info(c.gray(c.italic(`\n no files in directory`)));
    return;
  }

  console.info();
  const total = entries.length;
  const spinnerMsg = `calculating ${total} ${Str.plural(total, 'hash', 'hashes')}`;
  const spinner = Cli.spinner(c.gray(c.italic(spinnerMsg)));

  const table = Cli.table([]);
  for (const file of entries) {
    let path = file.path.slice(cwd.length);
    const ext = Fs.extname(path);
    const basename = Fs.basename(path);
    path = Fs.join(Fs.dirname(path), `${c.white(basename.slice(0, -ext.length))}${ext}`);

    const hx = await toHash(file.path);
    const hash = `${hx.hash.full.slice(0, -5)}${c.green(hx.hash.full.slice(-5))}`;
    table.push([c.gray(path), '→', c.gray(hash)]);
  }

  spinner.stop();
  console.info(table.toString());
}

/**
 * Prompts the user to select files and renames each
 * to its SHA-256 hash with extension.
 */
export async function selectFilesAndRenameToHash(dir: t.StringDir) {
  type T = { hx: string; in: t.StringPath; out: t.StringPath };
  const res: T[] = [];

  const table = Cli.table([]);
  const files = await promptFileSelection(dir, {
    deep: false,
    filter: (e) => !e.name.includes('→ sha256-'),
  });
  const spinner = Cli.spinner();

  for (const path of files) {
    const dir = Fs.dirname(path);
    const hx = await toHash(path);
    const outAppended = `${hx.filename.in} → ${hx.filename.out}`;
    const out = Fs.join(dir, outAppended);
    await Fs.write(out, hx.data, { force: true });

    res.push({ hx: hx.hash.full, in: path, out });
    table.push(['', c.gray(path.slice(dir.length)), '→', c.gray(hx.hash.short)]);
  }

  spinner.stop();
  console.info(table.toString());

  return res;
}

/**
 * Scans a directory for files named with a SHA-256 pattern and
 * copies them into a "-sha256" folder.
 */
export async function tidySha256Files(dir: t.StringDir) {
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
 * Removes files that have been renamed with SHA-256 hashes.
 */
export async function removeRenamedSh256Files(dir: t.StringDir, opts: { dryRun?: boolean } = {}) {
  const { dryRun = false } = opts;
  const paths = await getRenamedFilePaths(dir);
  if (paths.length === 0) return void console.info(c.gray(c.italic(`\n no files to remove`)));

  // Confirm:
  console.info();
  console.info(c.gray(`About to ${c.yellow('delete')} files:`));
  console.info();
  paths.forEach((e) => console.info(c.gray(` • ${Fs.basename(e.from)}`)));
  console.info();

  const yes = await Cli.Input.Confirm.prompt('Are you sure?');
  if (!yes) return;

  for (const path of paths) {
    await Fs.remove(path.from, { dryRun, log: true });
  }
}

/**
 * Helpers:
 */
async function getRenamedFilePaths(dir: t.StringDir) {
  type TFile = { from: t.StringPath; to: { filename: t.StringName } };
  const mapFile = (e: WalkEntry) => {
    const name = Fs.basename(e.path);
    const hashName = sha256FileFromText(name) ?? sha256FileFromText(e.path);
    return hashName ? { from: e.path, to: { filename: hashName } } : undefined;
  };

  const entries = await listFiles(dir, { depth: 1 });
  return entries.map(mapFile).filter((v): v is TFile => !!v);
}

async function listFiles(dir: t.StringDir, opts: { depth?: number } = {}) {
  const { depth = 1 } = opts;
  const glob = Fs.glob(dir, { exclude: EXCLUDE, depth });
  const entries = await glob.find('**');
  return entries.filter((e) => e.isFile);
}

function sha256FileFromText(text: string): string | undefined {
  const m = text.match(SHA256_FILE_RE);
  return m?.[1];
}
function isSha256File(text: string): boolean {
  return SHA256_FILE_RE.test(text);
}

async function toHash(path: t.StringPath) {
  const loaded = await Fs.read(path);
  if (loaded.error || !loaded.ok || !loaded.data) {
    throw new Error(`Failed to load file: ${path}`, { cause: loaded.error });
  }
  const data = loaded.data;
  const hx = Hash.sha256(data);
  const ext = Fs.extname(path);
  const filename = { in: Fs.basename(path), out: `${hx}${ext}` };
  const short = `${hx.slice(0, 13)}..${c.green(hx.slice(-5))}${ext}`;
  return {
    path,
    data,
    hash: { full: hx, short },
    filename,
  };
}
