import { Fs, Path, type t } from './common.ts';
import { PiEnv } from './u.env.ts';

export async function resolveRead(cwd: t.StringDir, denoDir: t.StringDir) {
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
