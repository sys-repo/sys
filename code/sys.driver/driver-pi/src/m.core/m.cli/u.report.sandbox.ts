import { Fs, pkg, slug, type t } from './common.ts';
import { PiFs } from '../u.fs.ts';

type Input = {
  readonly cwd: t.StringDir;
  readonly sandbox: t.PiCli.SandboxSummary;
};

const LOG_SUFFIX = 'sandbox.log.md' as const;

export const PiSandboxReport = {
  dir(cwd: t.StringDir) {
    return Fs.join(cwd, PiFs.logDir);
  },

  fileOf(cwd: t.StringDir) {
    const stamp = Math.floor(Date.now() / 1000);
    return Fs.join(PiSandboxReport.dir(cwd), `${stamp}.${slug()}.${LOG_SUFFIX}`) as t.StringPath;
  },

  async write(input: Input) {
    await migrateLegacyLogDir(input.cwd);
    const path = PiSandboxReport.fileOf(input.cwd);
    await Fs.ensureDir(Fs.dirname(path));
    await Fs.write(path, PiSandboxReport.text(input));
    return path;
  },

  text(input: Input) {
    const { sandbox } = input;
    const allowAll = sandbox.permissions === 'allow-all';
    const root = runtimeRoot(sandbox.cwd);
    const write = [root, ...(sandbox.write?.detail ?? [])];
    const context = [...(sandbox.context?.include ?? [])];
    const git = sandbox.cwd.git ? [`- cwd.git: ${sandbox.cwd.git}`] : [];
    const lines = [
      '# Pi Sandbox Report',
      '',
      `- pkg: ${pkg.name}@${pkg.version}`,
      `- time: ${new Date().toISOString()}`,
      `- cwd.root: ${root}`,
      ...git,
      `- cwd.invoked: ${sandbox.cwd.invoked}`,
      '',
      '## Summary',
      `- permissions: ${sandbox.permissions}`,
      `- read: ${allowAll ? 'all' : toSummary(sandbox.read)}`,
      `- write: ${allowAll ? 'all' : toSummary(sandbox.write, { temp: 'tmp' })}`,
      `- context: ${toContextSummary(sandbox.context)}`,
      '',
      '## Readable Paths',
      ...toCapabilityList(sandbox.permissions, sandbox.read?.detail ?? []),
      '',
      '## Writable Paths',
      ...toCapabilityList(sandbox.permissions, write),
      '',
      '## Context Files',
      ...toList(context),
      '',
    ];
    return lines.join('\n');
  },
} as const;

function runtimeRoot(cwd: t.PiCli.Cwd): t.StringDir {
  const root = cwd.root ?? cwd.git;
  if (!root) throw new Error('Pi sandbox report requires a resolved runtime root.');
  return root;
}

async function migrateLegacyLogDir(cwd: t.StringDir) {
  const from = Fs.join(cwd, PiFs.legacy.logDir) as t.StringPath;
  const to = Fs.join(cwd, PiFs.logDir) as t.StringPath;
  if (!(await Fs.exists(from))) return;

  const files = await Fs.glob(from, { includeDirs: false }).find('*');
  if (files.length === 0) {
    await Fs.remove(from);
    return;
  }

  if (!(await Fs.exists(to))) {
    await Fs.ensureDir(Fs.dirname(to));
    await Fs.move(from, to, { overwrite: false });
    return;
  }

  for (const file of files) {
    const target = rebase(file.path as t.StringPath, from, to);
    if (await Fs.exists(target)) {
      throw new Error(
        `Sandbox log migration would overwrite existing file: ${Fs.trimCwd(target)}.`,
      );
    }
  }

  for (const file of files) {
    const target = rebase(file.path as t.StringPath, from, to);
    await Fs.ensureDir(Fs.dirname(target));
    await Fs.move(file.path, target, { overwrite: false });
  }

  await removeIfEmpty(from);
}

function rebase(path: t.StringPath, from: t.StringPath, to: t.StringPath) {
  const suffix = path.slice(from.length).replace(/^\//, '');
  return Fs.join(to, suffix) as t.StringPath;
}

async function removeIfEmpty(dir: t.StringPath) {
  const remaining = await Fs.glob(dir, { includeDirs: true }).find('*');
  if (remaining.length === 0) await Fs.remove(dir);
}

function toSummary(
  input?: t.PiCli.SandboxSummary.Scope,
  alias: Record<string, string> = {},
) {
  const items = (input?.summary ?? []).map((item) => alias[item] ?? item);
  if (items.length === 0) return '-';
  return items.join(' + ');
}

function toContextSummary(input?: t.PiCli.SandboxSummary['context']) {
  return (input?.include?.length ?? 0) > 0 ? 'loaded context (wrapper-owned prompt)' : '-';
}

function toCapabilityList(permissions: t.PiCli.PermissionMode, items: readonly string[]) {
  if (permissions === 'allow-all') return ['- all (Deno --allow-all)'];
  return toList(items);
}

function toList(items: readonly string[]) {
  if (items.length === 0) return ['- none'];
  return items.map((item) => `- ${item}`);
}
