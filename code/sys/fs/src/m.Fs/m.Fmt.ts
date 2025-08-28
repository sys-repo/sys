import { type t, Path } from './common.ts';
import { walk } from './u.walk.ts';

type Node = { name: string; files: string[]; dirs: Map<string, Node> };

export const Fmt: t.FsFmtLib = {
  tree(paths, options = {}) {
    const rels = [...paths].filter(Boolean).map(normalizeRel).sort();
    const root: Node = { name: '', files: [], dirs: new Map() };
    for (const p of rels) insert(root, p.split('/'));

    const pad = ' '.repeat(Math.max(0, options.indent ?? 0));
    const lines: string[] = [];
    const label = options.label?.replace(/\/?$/, '/') ?? '';
    if (label) lines.push(pad + label);

    visit(root, '', 0, options, lines, pad);
    return lines.join('\n');
  },

  async treeFromDir(dir, options = {}) {
    const abs = Path.resolve(dir);
    const rels: string[] = [];
    for await (const e of walk(abs)) {
      if (e.isFile) rels.push(e.path.slice(abs.length + 1));
    }
    return Fmt.tree(rels, {
      ...options,
      trimPathLeft: undefined,
      label: options.label ?? Path.basename(abs) + '/',
    });
  },
};

/** Insert a path (split into parts) into the trie. */
function insert(node: Node, parts: string[]) {
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    const isFile = i === parts.length - 1;
    if (isFile) node.files.push(part);
    else {
      if (!node.dirs.has(part)) node.dirs.set(part, { name: part, files: [], dirs: new Map() });
      node = node.dirs.get(part)!;
    }
  }
}

/** DFS pretty-printer. */
function visit(
  node: Node,
  prefix: string,
  depth: number,
  opt: t.FsTreeOptions,
  out: string[],
  pad = '',
) {
  if (opt.maxDepth !== undefined && depth >= opt.maxDepth) return;

  const dirNames = [...node.dirs.keys()].sort();
  const fileNames = [...node.files].sort();

  dirNames.forEach((d, i) => {
    const isLast = i === dirNames.length - 1 && fileNames.length === 0;
    const branch = isLast ? '└─ ' : '├─ ';
    out.push(`${pad}${prefix}${branch}${d}/`);
    const nextPrefix = prefix + (isLast ? '   ' : '│  ');
    visit(node.dirs.get(d)!, nextPrefix, depth + 1, opt, out, pad);
  });

  fileNames.forEach((f, i) => {
    const isLast = i === fileNames.length - 1;
    const branch = isLast ? '└─ ' : '├─ ';
    out.push(`${pad}${prefix}${branch}${f}`);
  });
}

/** Normalize to POSIX-style relative 'a/b' with no leading './'. */
function normalizeRel(input: string): string {
  return input.replaceAll('\\', '/').replace(/^\.?\//, '');
}
