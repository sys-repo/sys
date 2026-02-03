import { type t, DEFAULT_IGNORE, Fs, Hash, Is, Json, Schema, SlugSchema, Yaml } from './common.ts';

export async function writeSlugTreeSha256Dir(args: {
  root: t.StringDir;
  targetDir: t.StringDir;
  include?: readonly string[];
  ignore?: readonly string[];
  includePath?: boolean;
}): Promise<t.SlugFileContentEntry[]> {
  const include = (args.include ?? ['.md']).map((ext) => ext.toLowerCase());
  const ignore = new Set([...DEFAULT_IGNORE, ...(args.ignore ?? [])]);
  const entries: t.SlugFileContentEntry[] = [];

  await walkDir(args.root);
  return entries;

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
      const frontmatter = readFrontmatter(source, abs);
      const payload: t.SlugFileContentDoc = args.includePath
        ? { source, path: rel, hash, contentType, frontmatter }
        : { source, hash, contentType, frontmatter };
      const validation = SlugSchema.FileContent.validate(payload);
      if (!validation.ok) {
        throw new Error(`Invalid slug-file-content payload for: ${rel}`);
      }
      entries.push(toEntry(payload));
      const outPath = Fs.join(args.targetDir, toSha256Filename(hash));
      await Fs.write(outPath, Json.stringify(payload));
    }
  }
}

export async function writeSlugFileContentIndex(args: {
  targetPath: t.StringFile;
  docid: t.StringId;
  entries: readonly t.SlugFileContentEntry[];
}): Promise<void> {
  const index: t.SlugFileContentIndex = { docid: args.docid, entries: [...args.entries] };
  const ok = Schema.Value.Check(SlugSchema.FileContent.Index, index);
  if (!ok) {
    throw new Error(`Invalid slug-file-content index: ${args.targetPath}`);
  }
  await Fs.ensureDir(Fs.dirname(args.targetPath));
  await Fs.write(args.targetPath, Json.stringify(index));
}

/**
 * Helpers:
 */
function toSha256Filename(hash: string): string {
  return `${hash}.json`;
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

function readFrontmatter(source: string, path: string): t.SlugFileContentFrontmatter {
  const frontmatter = parseFrontmatter(source);
  if (!frontmatter) {
    throw new Error(`Missing frontmatter in slug-tree source: ${path}`);
  }
  const ref = frontmatter.ref;
  if (!Is.str(ref) || ref.length === 0) {
    throw new Error(`Missing frontmatter ref in slug-tree source: ${path}`);
  }
  const title = frontmatter.title;
  if (title !== undefined && !Is.str(title)) {
    throw new Error(`Invalid frontmatter title in slug-tree source: ${path}`);
  }
  const normalized = {
    ...(frontmatter as Record<string, unknown>),
    ref: ref as t.StringRef,
  };
  if (title !== undefined) return { ...normalized, title } as t.SlugFileContentFrontmatter;
  return normalized as t.SlugFileContentFrontmatter;
}

function parseFrontmatter(source: string): Record<string, unknown> | undefined {
  const lines = source.split(/\r?\n/);
  if (lines[0] !== '---') return;
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new Error('Front-matter start found without closing delimiter.');
  }
  const raw = lines.slice(1, end).join('\n');
  if (!raw.trim()) return {};
  const parsed = Yaml.parse<Record<string, unknown>>(raw).data;
  return Is.record(parsed) ? (parsed as Record<string, unknown>) : {};
}

function toEntry(doc: t.SlugFileContentDoc): t.SlugFileContentEntry {
  const { source: _source, ...rest } = doc;
  return rest;
}
