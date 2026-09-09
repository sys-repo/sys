import { Fs, type t } from './common.ts';

export async function clearTargetDir(args: {
  baseDir: t.StringDir;
  targetDir: t.StringDir;
}): Promise<void> {
  const base = Fs.Path.resolve(args.baseDir);
  const target = Fs.Path.resolve(args.targetDir);

  const rel = Fs.Path.relative(base, target).replaceAll('\\', '/');
  const isInside = rel.length > 0 && rel !== '.' && rel !== '..' && !rel.startsWith('../');
  if (!isInside) {
    throw new Error(`Refusing to clear outside pull base: ${target}`);
  }

  if (await Fs.exists(target)) {
    await Fs.remove(target, { log: false });
  }
}
