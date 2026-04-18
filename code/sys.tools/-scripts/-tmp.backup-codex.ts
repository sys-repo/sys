import { c, Cli, Fmt, Fs, Is, Str } from '../src/common.ts';

export async function backupCodexJsonl(args?: {
  fromSessions?: string;
  fromArchived?: string;
  to?: string;
  dryRun?: boolean;
  latest?: boolean;
  duplicate?: boolean;
}) {
  const {
    fromSessions = '~/.codex/sessions',
    fromArchived = '~/.codex/archived_sessions',
    to = '~/code.data/-backup.codex',
    dryRun = false,
    latest = true,
    duplicate = false,
  } = args ?? {};

  console.info();
  console.info(c.bold(c.cyan('Backup Codex JSONL')));

  const cwd = Fs.cwd('terminal');
  const sessionsPath = Fs.Path.resolve(cwd, Fs.Tilde.expand(fromSessions));
  const archivedPath = Fs.Path.resolve(cwd, Fs.Tilde.expand(fromArchived));
  const toRoot = Fs.Path.resolve(cwd, Fs.Tilde.expand(to));

  const sessionsExists = await Fs.exists(sessionsPath);
  const archivedExists = await Fs.exists(archivedPath);
  const sessionsIsDir = sessionsExists ? await Fs.Is.dir(sessionsPath) : false;
  const archivedIsDir = archivedExists ? await Fs.Is.dir(archivedPath) : false;
  const sizeBytes = await totalBytes([sessionsPath, archivedPath]);

  const latestRoot = Fs.join(toRoot, 'latest');
  const latestSessions = Fs.join(latestRoot, 'sessions');
  const latestArchived = Fs.join(latestRoot, 'archived_sessions');

  const duplicatePlan = duplicate ? await planDuplicate(toRoot) : undefined;

  const table = Cli.table().padding(1);
  table.push([c.gray('dry-run:'), c.cyan(String(dryRun))]);
  table.push([c.gray('latest:'), c.cyan(String(latest))]);
  table.push([c.gray('duplicate:'), c.cyan(String(duplicate))]);
  table.push([c.gray('size:'), c.cyan(Str.bytes(sizeBytes))]);
  table.push([c.gray('sessions:'), fmtPath(sessionsPath, sessionsExists)]);
  table.push([c.gray('archived:'), fmtPath(archivedPath, archivedExists)]);
  table.push([c.gray('to-root:'), fmtPath(toRoot, await Fs.exists(toRoot))]);
  if (latest) table.push([c.gray('latest:'), fmtPath(latestRoot, await Fs.exists(latestRoot))]);
  if (duplicatePlan?.target) {
    table.push([c.gray('duplicate:'), fmtPath(duplicatePlan.target, duplicatePlan.exists)]);
  }
  console.info(String(table));
  console.info();

  if (!sessionsExists || !sessionsIsDir) {
    console.info(c.yellow('sessions path is missing or not a directory'));
    return;
  }

  if (!archivedExists || !archivedIsDir) {
    console.info(c.yellow('archived path is missing or not a directory'));
    return;
  }

  if (dryRun) return;

  await Fs.ensureDir(toRoot);

  if (latest) {
    await replaceDir(sessionsPath, latestSessions);
    await replaceDir(archivedPath, latestArchived);
  }

  if (duplicatePlan?.target) {
    await Fs.ensureDir(duplicatePlan.target);
    await copyDir(sessionsPath, Fs.join(duplicatePlan.target, 'sessions'));
    await copyDir(archivedPath, Fs.join(duplicatePlan.target, 'archived_sessions'));
  }
}

async function replaceDir(from: string, to: string) {
  if (await Fs.exists(to)) await Fs.remove(to, { log: true });
  await copyDir(from, to);
}

async function copyDir(from: string, to: string) {
  const res = await Fs.copy(from, to, { log: true, throw: true });
  if (res.error) throw res.error;
}

async function planDuplicate(root: string) {
  const entries = await listDuplicateEntries(root);
  const nextIndex = entries.length === 0 ? 0 : entries[entries.length - 1].index + 1;
  const suffix = String(nextIndex).padStart(3, '0');
  return {
    target: Fs.join(root, `-codex.${suffix}`),
    exists: false,
  } as const;
}

async function listDuplicateEntries(root: string) {
  const rootExists = await Fs.exists(root);
  const rootIsDir = rootExists ? await Fs.Is.dir(root) : false;
  const existing = rootIsDir ? await Fs.ls(root, { includeDirs: true }) : [];

  const entries: Array<{ path: string; index: number }> = [];
  for (const entry of existing) {
    const name = Fs.basename(entry);
    const match = name.match(/^-codex\.(\d{3})$/);
    if (!match) continue;
    if (!(await Fs.Is.dir(entry))) continue;

    const value = Number(match[1]);
    if (!Is.number(value) || Number.isNaN(value)) continue;
    entries.push({ path: entry, index: value });
  }

  return entries.sort((a, b) => a.index - b.index);
}

function fmtPath(path: string, exists: boolean) {
  return `${Fmt.prettyPath(Fs.trimCwd(path))} ${c.dim(`[existed=${exists}]`)}`;
}

async function totalBytes(paths: readonly string[]) {
  let total = 0;
  for (const path of paths) {
    const size = await Fs.Size.dir(path);
    total += size.total.bytes;
  }
  return total;
}

if (import.meta.main) {
  await backupCodexJsonl();
}
