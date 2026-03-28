import { type t, DenoFile, Esm, Fs, Is } from './common.ts';

export async function resolveTargetEntry(
  targetDir: t.StringDir,
): Promise<{ readonly path: t.StringPath; readonly hasDefaultExport: boolean }> {
  const denofile = await DenoFile.load(targetDir);
  const exportsRoot = denofile.data?.exports?.['.'];
  const candidates = [
    Is.str(exportsRoot) ? Fs.join(targetDir, exportsRoot) : undefined,
    Fs.join(targetDir, 'src/mod.ts'),
    Fs.join(targetDir, 'mod.ts'),
  ].filter((value): value is t.StringPath => Is.str(value));

  for (const candidate of candidates) {
    if (await Fs.exists(candidate)) {
      const source = (await Fs.readText(candidate)).data ?? '';
      return {
        path: candidate,
        hasDefaultExport: Esm.hasDefaultExport(source),
      };
    }
  }

  throw new Error(`DenoDeploy.stage: unable to resolve target entry from '${targetDir}'`);
}
