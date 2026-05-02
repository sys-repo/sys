import { Fs, slug, Str, type t } from './common.ts';

type ContextRole = 'context' | 'system';

type ContextEntry = {
  readonly path: t.StringPath;
  readonly content: string;
  readonly role: ContextRole;
};

type ResolveInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly append?: readonly t.StringPath[];
  readonly defaultSystem?: boolean;
};

type ResolvedContext = {
  readonly args: readonly string[];
  readonly include: readonly t.StringPath[];
  readonly systemPromptAppend?: string;
};

const DEFAULT_AGENT_CONTEXT = 'AGENTS.md';
const DEFAULT_SYSTEM_CONTEXT = 'SYSTEM.md';

export const ProfileContext = {
  defaults: [DEFAULT_AGENT_CONTEXT, DEFAULT_SYSTEM_CONTEXT] as const,

  async resolve(input: ResolveInput): Promise<ResolvedContext> {
    const entries = await loadEntries(input);
    const contextEntries = entries.filter((entry) => entry.role === 'context');
    const systemEntries = entries.filter((entry) => entry.role === 'system');
    const args = contextEntries.length > 0
      ? ['--append-system-prompt', await writeBundle(input.cwd.git, contextEntries)]
      : [];

    return {
      args,
      include: entries.map((entry) => entry.path),
      systemPromptAppend: systemEntries.length > 0 ? formatSystemAppend(systemEntries) : undefined,
    };
  },

  async toPromptArgs(input: ResolveInput) {
    return (await ProfileContext.resolve(input)).args;
  },
} as const;

/**
 * Helpers:
 */
async function loadEntries(input: ResolveInput) {
  const entries: ContextEntry[] = [];
  const seen = new Set<string>();

  await pushOptional(entries, seen, {
    path: Fs.join(input.cwd.git, DEFAULT_AGENT_CONTEXT) as t.StringPath,
    cwd: input.cwd.git,
    role: 'context',
  });

  if (input.defaultSystem !== false) {
    await pushOptional(entries, seen, {
      path: Fs.join(input.cwd.git, DEFAULT_SYSTEM_CONTEXT) as t.StringPath,
      cwd: input.cwd.git,
      role: 'system',
    });
  }

  for (const path of input.append ?? []) {
    await pushRequired(entries, seen, {
      path: Fs.resolve(input.cwd.invoked, path) as t.StringPath,
      cwd: input.cwd.git,
      role: 'context',
    });
  }

  return entries;
}

async function pushOptional(
  entries: ContextEntry[],
  seen: Set<string>,
  args: { path: t.StringPath; cwd: t.StringDir; role: ContextRole },
) {
  if (seen.has(args.path)) return;
  const content = await readOptionalContextFile(args.path, args.cwd);
  if (content === undefined) return;
  seen.add(args.path);
  entries.push({ path: args.path, content, role: args.role });
}

async function pushRequired(
  entries: ContextEntry[],
  seen: Set<string>,
  args: { path: t.StringPath; cwd: t.StringDir; role: ContextRole },
) {
  if (seen.has(args.path)) return;
  const content = await readRequiredContextFile(args.path, args.cwd);
  seen.add(args.path);
  entries.push({ path: args.path, content, role: args.role });
}

async function readOptionalContextFile(path: t.StringPath, cwd: t.StringDir) {
  if (!(await Fs.exists(path))) return undefined;
  return await readRequiredContextFile(path, cwd);
}

async function readRequiredContextFile(path: t.StringPath, cwd: t.StringDir) {
  const read = await Fs.readText(path);
  if (!read.ok) {
    throw new Error(`Could not read profile context file: ${toDisplayPath(path, cwd)}`);
  }
  return read.data ?? '';
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

    Wrapper-loaded context files:
    `,
  ).trimStart();
  const body = entries.map((entry) => formatEntry(entry)).join('\n\n');
  return `${header}\n${body}\n`;
}

function formatSystemAppend(entries: readonly ContextEntry[]) {
  const header = Str.dedent(
    `
    # Local System Instructions

    Wrapper-loaded system instruction files:
    `,
  ).trimStart();
  const body = entries.map((entry) => formatEntry(entry)).join('\n\n');
  return `${header}\n${body}`.trimEnd();
}

function formatEntry(entry: ContextEntry) {
  return `## ${entry.path}\n\n${entry.content.trimEnd()}`;
}

function toDisplayPath(path: t.StringPath, cwd: t.StringDir) {
  return Fs.trimCwd(path, { cwd });
}
