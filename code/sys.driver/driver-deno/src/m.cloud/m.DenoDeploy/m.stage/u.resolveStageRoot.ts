import { type t, D, Fs, Path } from './common.ts';

export async function resolveStageRoot(
  workspaceDir: t.StringDir,
  root?: t.DenoDeploy.Stage.Root,
): Promise<t.StringDir> {
  if (!root || root.kind === 'temp') {
    return (await Fs.makeTempDir({ prefix: D.stageTempDirPrefix })).absolute;
  }

  const dir = Path.resolve(root.dir);
  const workspaceRoot = Path.resolve(workspaceDir);
  if (dir === workspaceRoot || dir.startsWith(Fs.join(workspaceRoot, ''))) {
    throw new Error(
      `DenoDeploy.stage: stage root '${dir}' must be outside workspace '${workspaceRoot}'`,
    );
  }

  const exists = await Fs.exists(dir);
  if (!exists) return dir;

  if (!(await Fs.Is.dir(dir))) {
    throw new Error(`DenoDeploy.stage: stage root '${dir}' exists and is not a directory`);
  }

  const items = await Fs.ls(dir);
  if (items.length > 0) {
    throw new Error(`DenoDeploy.stage: stage root '${dir}' must be empty`);
  }

  return dir;
}
