import { type t, DEFAULT_IGNORE, Fs, Hash, Json, SlugSchema } from './common.ts';

type Entry = t.SlugFileContentDoc;

function toSha256Filename(hash: string): string {
  return `${hash}.json`;
}

export async function writeSlugTreeSha256Dir(args: {
  root: t.StringDir;
  targetDir: t.StringDir;
  include?: readonly string[];
  ignore?: readonly string[];
  includePath?: boolean;
}): Promise<void> {
  const include = (args.include ?? ['.md']).map((ext) => ext.toLowerCase());
  const ignore = new Set([...DEFAULT_IGNORE, ...(args.ignore ?? [])]);

  await walkDir(args.root);

  async function walkDir(dir: string): Promise<void> {
    for await (const entry of Deno.readDir(dir)) {
      if (isIgnored(entry.name, ignore)) continue;
      const abs = Fs.join(dir, entry.name);

      if (entry.isDirectory) {
        await walkDir(abs);
        continue;
      }

      if (!entry.isFile || !isIncluded(entry.name, include)) continue;

      const res = await Fs.readText(abs);
      const source = String(res.data ?? '');
      const hash = Hash.sha256(source);
      const rel = Fs.Path.relative(args.root, abs);
      const contentType = toContentType(entry.name);
      const payload: Entry = args.includePath
        ? { source, path: rel, hash, contentType }
        : { source, hash, contentType };
      const validation = SlugSchema.FileContent.validate(payload);
      if (!validation.ok) {
        throw new Error(`Invalid slug-file-content payload for: ${rel}`);
      }
      const outPath = Fs.join(args.targetDir, toSha256Filename(hash));
      await Fs.write(outPath, Json.stringify(payload));
    }
  }
}

function isIgnored(name: string, ignore: Set<string>): boolean {
  if (name.startsWith('.')) return true;
  return ignore.has(name);
}

function isIncluded(name: string, include: readonly string[]): boolean {
  const ext = Fs.extname(name).toLowerCase();
  return include.includes(ext);
}

function toContentType(name: string): string {
  const ext = Fs.extname(name).toLowerCase();
  if (ext === '.md') return 'text/markdown';
  return 'application/octet-stream';
}
