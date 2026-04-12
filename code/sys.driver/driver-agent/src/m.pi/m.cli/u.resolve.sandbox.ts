import { Fs, type t } from './common.ts';
import { PiEnv } from './u.env.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';
import { PiArgs } from './u.args.ts';

const SHELLS = new Set(['/bin/bash', '/bin/sh', '/bin/zsh']);

export async function resolveSandboxSummary(args: {
  cwd: t.StringDir;
  read?: readonly t.StringPath[];
  write?: readonly t.StringPath[];
  context?: t.PiCli.SandboxSummary['context'];
}): Promise<t.PiCli.SandboxSummary> {
  const denoDir = PiArgs.toDenoDir(args.cwd);
  const tmpDir = await PiEnv.toTmpDir();
  const read = await resolveRead(args.cwd, denoDir, [
    ...(args.read ?? []),
    ...(args.context?.include ?? []),
  ]);
  const write = await resolveWrite(args.cwd, args.write ?? []);

  const context = toContext(args.cwd, read, args.context);

  return {
    cwd: args.cwd,
    read: toReadScope(args.cwd, read, tmpDir),
    write: toWriteScope(args.cwd, write, tmpDir),
    context,
  };
}

function toReadScope(
  cwd: t.StringDir,
  paths: readonly t.StringPath[],
  tmpDir?: t.StringDir,
): t.PiCli.SandboxSummary.Scope {
  const groups = new Set<string>(['cwd']);
  const detail: t.StringPath[] = [];

  for (const path of unique(paths)) {
    if (path === cwd) continue;

    if (isRuntimeRead(cwd, path, tmpDir)) {
      groups.add('runtime');
      detail.push(path);
      continue;
    }

    if (isContextRead(cwd, path)) {
      groups.add('context');
      continue;
    }

    if (isProbeRead(cwd, path)) {
      groups.add('probe');
      detail.push(path);
      continue;
    }
  }

  return {
    summary: [...groups],
    detail: detail.length > 0 ? detail : undefined,
  };
}

function toContext(
  cwd: t.StringDir,
  paths: readonly t.StringPath[],
  input?: t.PiCli.SandboxSummary['context'],
): t.PiCli.SandboxSummary['context'] {
  const detail = unique(paths.filter((path) => isContextRead(cwd, path)));
  return {
    agents: input?.agents,
    include: [...(input?.include ?? [])],
    detail: detail.length > 0 ? detail : undefined,
  };
}

function toWriteScope(
  cwd: t.StringDir,
  paths: readonly t.StringPath[],
  tmpDir?: t.StringDir,
): t.PiCli.SandboxSummary.Scope {
  const groups = new Set<string>(['cwd']);
  const detail: t.StringPath[] = [];

  for (const path of unique(paths)) {
    if (path === cwd) continue;
    if (isTempPath(path, tmpDir)) groups.add('temp');
    else groups.add('extra');
    detail.push(path);
  }

  return {
    summary: [...groups],
    detail: detail.length > 0 ? detail : undefined,
  };
}

function unique(paths: readonly t.StringPath[]) {
  const seen = new Set<string>();
  const next: t.StringPath[] = [];
  for (const path of paths) {
    if (seen.has(path)) continue;
    seen.add(path);
    next.push(path);
  }
  return next;
}

function isRuntimeRead(cwd: t.StringDir, path: t.StringPath, tmpDir?: t.StringDir) {
  return path === PiArgs.toDenoDir(cwd) || SHELLS.has(path) || isTempPath(path, tmpDir);
}

function isContextRead(cwd: t.StringDir, path: t.StringPath) {
  return (
    path.endsWith('/AGENTS.md') ||
    path.includes('/sys.canon/')
  );
}

function isProbeRead(cwd: t.StringDir, path: t.StringPath) {
  return (
    path.endsWith('/CLAUDE.md') ||
    path.endsWith('/.git') ||
    path.endsWith('/.agents/skills') ||
    (!path.startsWith(`${cwd}/`) && !path.endsWith('/AGENTS.md') && !path.includes('/sys.canon/'))
  );
}

function isTempPath(path: t.StringPath, tmpDir?: t.StringDir) {
  return tmpDir ? path === tmpDir || path.startsWith(`${tmpDir}/`) : false;
}
