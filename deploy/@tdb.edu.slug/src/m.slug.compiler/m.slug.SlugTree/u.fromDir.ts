import { type t, Arr, Fs, DEFAULT_IGNORE } from './common.ts';
import { ensureFrontmatterRef } from './u.frontmatter.ts';

type DirEntry = {
  readonly name: string;
  readonly path: string;
  readonly isDirectory: boolean;
  readonly isFile: boolean;
};

export const fromDir: t.SlugTreeFromDir = async (args, opts = {}) => {
  const { root, createCrdt } = args;
  const ignore = new Set([...DEFAULT_IGNORE, ...(opts.ignore ?? [])]);
  const sort = opts.sort ?? true;
  const readmeAsIndex = opts.readmeAsIndex ?? true;

  const items: t.SlugTreeItem[] = [];
  const entries = await readDir(root, ignore, sort);
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
    const entries = await readDir(dir, ignore, sort);
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
      const node: t.SlugTreeItemRefOnly = {
        slug: slugName,
        ref,
        slugs: children.length ? children : undefined,
      };
      return node;
    }

    if (!children.length) return;
    const node: t.SlugTreeItemInline = {
      slug: slugName,
      slugs: children,
    };
    return node;
  }

  async function buildFile(
    path: string,
    filename: string,
  ): Promise<t.SlugTreeItemRefOnly | undefined> {
    const slug = stripExt(filename);
    if (!slug) return;
    const ref = await ensureRef(path, createCrdt);
    return { slug, ref };
  }
};

async function readDir(dir: string, ignore: Set<string>, sort: boolean): Promise<DirEntry[]> {
  const entries: DirEntry[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (isIgnored(entry.name, ignore)) continue;
    entries.push({
      name: entry.name,
      path: Fs.join(dir, entry.name),
      isDirectory: entry.isDirectory,
      isFile: entry.isFile,
    });
  }

  if (!sort) return entries;
  const withKey = entries.map((entry) => ({ ...entry, sortKey: entry.name.toLowerCase() }));
  return Arr.sortBy(withKey, 'sortKey').map(({ sortKey: _s, ...rest }) => rest);
}

function isIgnored(name: string, ignore: Set<string>): boolean {
  if (name.startsWith('.')) return true;
  return ignore.has(name);
}

function isReadme(name: string): boolean {
  return name.toLowerCase() === 'readme.md';
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
  createCrdt: () => Promise<t.StringRef>,
): Promise<t.StringRef> {
  const current = (await Fs.readText(path)).data ?? '';
  const res = await ensureFrontmatterRef({ text: current, createCrdt });
  if (res.updated) {
    const next = res.text.endsWith('\n') ? res.text : `${res.text}\n`;
    await Fs.write(path, next);
  }
  return res.ref;
}
