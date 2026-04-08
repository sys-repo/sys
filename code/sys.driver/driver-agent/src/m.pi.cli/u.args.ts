import { Fs, Path, type t } from './common.ts';
import { PiEnv } from './u.env.ts';

const PI_CLI_TMP_SEGMENTS = ['.tmp', 'pi.cli'] as const;

export const PiArgs = {
  async toPiArgs(cwd: t.StringDir, args: readonly string[]) {
    const denoDir = PiArgs.toDenoDir(cwd);
    const readScope = (await resolveReadScope(cwd, denoDir)).join(',');
    const writeScope = resolveWriteScope(cwd).join(',');
    return [
      'run',
      '--node-modules-dir=none',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      '--allow-sys=homedir,osRelease,uid',
      `--allow-read=${readScope}`,
      `--allow-write=${writeScope}`,
      `--allow-ffi=${denoDir}`,
      'npm:@mariozechner/pi-coding-agent',
      ...args,
    ] as const;
  },

  toAgentDir(cwd: t.StringDir) {
    return Fs.join(cwd, ...PI_CLI_TMP_SEGMENTS, 'agent');
  },

  toDenoDir(cwd: t.StringDir) {
    return Fs.join(cwd, ...PI_CLI_TMP_SEGMENTS, 'deno');
  },
} as const;

/**
 * Helpers:
 */

function toExecutableReadScope() {
  const scope = new Set<string>([
    '/bin/bash',
    '/bin/sh',
    '/bin/zsh',
  ]);
  scope.add(PiEnv.toShellPath());
  return [...scope];
}

async function resolveReadScope(cwd: t.StringDir, denoDir: t.StringDir) {
  const scope = new Set<string>([cwd, denoDir]);
  for (const path of toExecutableReadScope()) scope.add(path);
  const tmpDir = PiEnv.toTmpDir();
  if (tmpDir) scope.add(tmpDir);
  const homeAgentsSkillsDir = PiEnv.toHomeAgentsSkillsDir();
  if (homeAgentsSkillsDir) scope.add(homeAgentsSkillsDir);
  const googleApplicationDefaultCredentialsPath = PiEnv.toGoogleApplicationDefaultCredentialsPath();
  if (googleApplicationDefaultCredentialsPath) scope.add(googleApplicationDefaultCredentialsPath);
  for (const path of ancestorContextPaths(cwd)) scope.add(path);
  const gitRoot = await findGitRoot(cwd);
  if (!gitRoot) return [...scope];

  scope.add(gitRoot);
  const parent = Path.dirname(gitRoot) as t.StringDir;

  if (await Fs.stat(agents)) scope.add(agents);
  if (await Fs.stat(sysCanon)) scope.add(sysCanon);

  return [...scope];
}

function ancestorContextPaths(dir: t.StringDir) {
  const paths: string[] = [];
  let current = dir;
  while (true) {
    paths.push(Fs.join(current, 'AGENTS.md'));
    const parent = Path.dirname(current) as t.StringDir;
    if (parent === current) return paths;
    current = parent;
  }
}

async function findGitRoot(dir: t.StringDir): Promise<t.StringDir | undefined> {
  let current = dir;
  while (true) {
    if (await Fs.stat(Fs.join(current, '.git'))) return current;
    const parent = Path.dirname(current) as t.StringDir;
    if (parent === current) return undefined;
    current = parent;
  }
}
