import type { t } from '../common.ts';
import { Arr, Fs, DEFAULT_IGNORE, Ignore } from './common.ts';
import { ensureFrontmatterRef, readFrontmatterRef } from './u.frontmatter.ts';

type DirEntry = {
  readonly name: string;
  readonly path: string;
  readonly isDirectory: boolean;
  readonly isFile: boolean;
};

export const fromDir: t.SlugTreeFsFromDir = async (args, opts = {}) => {
  const { root, createCrdt } = args;
  const ignore = createIgnoreMatcher(opts.ignore);
  const sort = opts.sort ?? true;
  const readmeAsIndex = opts.readmeAsIndex ?? true;

  const items: t.SlugTreeItem[] = [];
  const entries = await readDir(root, root, ignore, sort);
  for (const entry of entries) {
    if (entry.isDirectory) {
      const node = await buildDir(entry.path, entry.name);
      if (node) items.push(node);
      continue;
    }

    if (entry.isFile && isMarkdown(entry.name)) {
      const node = await buildFile(entry.path, entry.name);
      if (node) items.push(node);
    }
  }

  return { tree: items };

  async function buildDir(dir: string, slugName: string): Promise<t.SlugTreeItem | undefined> {
    const entries = await readDir(root, dir, ignore, sort);
    const children: t.SlugTreeItem[] = [];
    let readmePath: string | undefined;

    for (const entry of entries) {
      if (entry.isDirectory) {
        const child = await buildDir(entry.path, entry.name);
        if (child) children.push(child);
        continue;
      }

      if (!entry.isFile || !isMarkdown(entry.name)) continue;
      if (readmeAsIndex && isReadme(entry.name)) {
        readmePath = entry.path;
        continue;
      }

      const leaf = await buildFile(entry.path, entry.name);
      if (leaf) children.push(leaf);
    }

    if (readmePath) {
      const ref = await ensureRef(readmePath, createCrdt);
      const slugs = children.length ? children : undefined;
      if (ref) {
        const node: t.SlugTreeItemRefOnly = { ref, slug: slugName, slugs };
        return node;
      }
      const node: t.SlugTreeItemInline = { slug: slugName, slugs };
      return node;
    }

    if (!children.length) return;
    const node: t.SlugTreeItemInline = { slug: slugName, slugs: children };
    return node;
  }

  async function buildFile(path: string, filename: string): Promise<t.SlugTreeItem | undefined> {
    const slug = stripExt(filename);
    if (!slug) return;
    const ref = await ensureRef(path, createCrdt);
    if (ref) return { slug, ref };
    return { slug };
  }
};

async function readDir(
  root: t.StringDir,
  dir: string,
  ignore: ReturnType<typeof Ignore.create>,
  sort: boolean,
): Promise<DirEntry[]> {
  const entries: DirEntry[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const path = Fs.join(dir, entry.name);
    const rel = Fs.Path.relative(root, path) as t.StringPath;
    if (isIgnored(rel, ignore)) continue;
    entries.push({
      name: entry.name,
      path,
      isDirectory: entry.isDirectory,
      isFile: entry.isFile,
    });
  }

  if (!sort) return entries;
  const withKey = entries.map((entry) => ({ ...entry, sortKey: entry.name.toLowerCase() }));
  return Arr.sortBy(withKey, 'sortKey').map(({ sortKey: _s, ...rest }) => rest);
}

function createIgnoreMatcher(input?: readonly string[]): ReturnType<typeof Ignore.create> {
  const rules = Ignore.normalize([...DEFAULT_IGNORE, '.*', ...(input ?? [])]);
  return Ignore.create(rules);
}

function isIgnored(path: t.StringPath, ignore: ReturnType<typeof Ignore.create>): boolean {
  return ignore.isIgnored(path);
}

function isReadme(name: string): boolean {
  const value = name.toLowerCase();
  return value === 'readme.md' || value === '-readme.md';
}

function isMarkdown(name: string): boolean {
  const ext = Fs.extname(name).toLowerCase();
  return ext === '.md';
}

function stripExt(name: string): string {
  const ext = Fs.extname(name);
  if (!ext) return name;
  return name.slice(0, -ext.length);
}

async function ensureRef(
  path: t.StringFile,
  createCrdt?: () => Promise<t.StringRef | undefined | null | void>,
): Promise<t.StringRef | undefined> {
  const current = (await Fs.readText(path)).data ?? '';
  const generated = await resolveGeneratedRef(createCrdt);
  if (!generated) return readFrontmatterRef(current);

  const res = await ensureFrontmatterRef({ text: current, createCrdt: async () => generated });
  if (res.updated) {
    const next = res.text.endsWith('\n') ? res.text : `${res.text}\n`;
    await Fs.write(path, next);
  }
  return res.ref;
}

async function resolveGeneratedRef(
  createCrdt?: () => Promise<t.StringRef | undefined | null | void>,
): Promise<t.StringRef | undefined> {
  if (!createCrdt) return;
  const value = await createCrdt();
  if (!value) return;
  const text = String(value).trim();
  return text.length > 0 ? (text as t.StringRef) : undefined;
}
