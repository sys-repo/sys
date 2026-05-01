import { Fs, slug, Str, type t } from './common.ts';

type ContextEntry = {
  readonly path: t.StringPath;
  readonly content: string;
};

type ResolveInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly include?: readonly t.StringPath[];
};

export const ProfileContext = {
  async toPromptArgs(input: ResolveInput) {
    const entries = await loadEntries(input);
    if (entries.length === 0) return [] as const;

    const bundle = await writeBundle(input.cwd.git, entries);
    return ['--append-system-prompt', bundle] as const;
  },
} as const;

/**
 * Helpers:
 */
async function loadEntries(input: ResolveInput) {
  const entries: ContextEntry[] = [];
  for (const path of input.include ?? []) {
    const resolved = Fs.resolve(input.cwd.invoked, path) as t.StringPath;
    const read = await Fs.readText(resolved);
    if (!read.ok) {
      throw new Error(
        `Could not read profile context file: ${toDisplayPath(resolved, input.cwd.git)}`,
      );
    }
    entries.push({ path: resolved, content: read.data ?? '' });
  }
  return entries;
}

async function writeBundle(cwd: t.StringDir, entries: readonly ContextEntry[]) {
  const path = Fs.join(
    cwd,
    '.tmp',
    'pi.cli',
    'context',
    `${Date.now()}.${slug()}.context.md`,
  ) as t.StringPath;
  await Fs.ensureDir(Fs.dirname(path));
  await Fs.write(path, formatBundle(entries));
  return path;
}

function formatBundle(entries: readonly ContextEntry[]) {
  const header = Str.dedent(
    `
    # Project Context

    Profile-selected context files:
    `,
  ).trimStart();
  const body = entries.map((entry) => formatEntry(entry)).join('\n\n');
  return `${header}\n${body}\n`;
}

function formatEntry(entry: ContextEntry) {
  return `## ${entry.path}\n\n${entry.content.trimEnd()}`;
}

function toDisplayPath(path: t.StringPath, cwd: t.StringDir) {
  return Fs.trimCwd(path, { cwd });
}
