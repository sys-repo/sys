import { Fs, pkg, SAMPLE, type t } from '../../-test.ts';
import { Vite } from '../mod.ts';

type BuiltJsFile = { readonly filename: string; readonly text: string };
type BuiltFiles = {
  readonly html: string;
  readonly dist: t.DistPkg | undefined;
  readonly js: readonly BuiltJsFile[];
};
type BuiltSample = {
  readonly build: t.ViteBuildResponse;
  readonly outDir: string;
  readonly files: BuiltFiles;
};

export async function buildSample(args: {
  sampleName: string;
  sampleDir: t.StringDir;
  entry?: string;
}): Promise<BuiltSample> {
  const { sampleName, sampleDir, entry } = args;
  const fs = SAMPLE.fs(sampleName);
  await Fs.copy(sampleDir, fs.dir);

  if (entry && entry !== './index.html') {
    const source = entry.startsWith('./') ? entry.slice(2) : entry;
    const html = (await Fs.readText(Fs.join(fs.dir, source))).data;
    if (typeof html !== 'string') throw new Error(`Missing fixture entry html: ${entry}`);
    await Fs.write(Fs.join(fs.dir, 'index.html'), html);
  }

  const build = await Vite.build({
    cwd: fs.dir,
    pkg,
    silent: true,
    spinner: false,
    exitOnError: false,
  });

  const outDir = Fs.join(build.paths.cwd, build.paths.app.outDir);
  return {
    build,
    outDir,
    files: await readBuiltFiles(outDir),
  };
}

async function readBuiltFiles(outDir: string): Promise<BuiltFiles> {
  const html = (await Fs.readText(Fs.join(outDir, 'index.html'))).data ?? '';
  const dist = (await Fs.readJson<t.DistPkg>(Fs.join(outDir, 'dist.json'))).data;
  const names = Object.keys(dist?.hash?.parts ?? {});
  const js = await Promise.all(
    names
      .filter((filename) => filename.endsWith('.js'))
      .map(async (filename) => ({
        filename,
        text: (await Fs.readText(Fs.join(outDir, filename))).data ?? '',
      })),
  );

  return { html, dist, js };
}
