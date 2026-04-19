import { D, DenoFile, Fs, Path, type t, Process, Str } from './common.ts';

export async function buildStageTarget(targetDir: t.StringDir) {
  const denofile = await DenoFile.load(targetDir);
  const task = denofile.data?.tasks?.build;
  if (!task) return;

  const withImportMap = await prepareBuildImportMap(targetDir);
  try {
    const build = await Process.invoke({
      cmd: D.cmd.deno,
      args: ['task', 'build'],
      cwd: targetDir,
      silent: true,
    });

    if (!build.success) {
      throw new Error(Str.dedent(`
        DenoDeploy.stage: build failed for staged target '${targetDir}' (code ${build.code}).

        stdout:
        ${build.text.stdout}

        stderr:
        ${build.text.stderr}
      `));
    }
  } finally {
    await withImportMap.restore();
  }
}

async function prepareBuildImportMap(targetDir: t.StringDir) {
  const workspaceFile = await DenoFile.nearest(targetDir, (e) => Array.isArray(e.file.workspace));
  if (!workspaceFile) return { restore: async () => {} };

  const importsPath = Fs.join(Path.dirname(workspaceFile.path), 'imports.json');
  if (!(await Fs.exists(importsPath))) return { restore: async () => {} };

  const denoPath = Fs.join(targetDir, 'deno.json');
  const current = await Fs.readText(denoPath);
  const currentText = current.ok ? current.data : undefined;
  if (currentText === undefined) return { restore: async () => {} };

  const json = await Fs.readJson<Record<string, unknown>>(denoPath);
  if (!json.ok || !json.data) return { restore: async () => {} };

  const relative = Path.relative(targetDir, importsPath).replaceAll('\\', '/');
  await Fs.writeJson(denoPath, { ...json.data, importMap: relative });

  return {
    restore: async () => {
      await Fs.write(denoPath, currentText, { force: true });
    },
  };
}
