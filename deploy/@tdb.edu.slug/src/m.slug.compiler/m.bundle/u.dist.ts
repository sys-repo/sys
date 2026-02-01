import { type t, Fs, Pkg } from './common.ts';

export async function writeDistFiles(dirs: Iterable<t.StringDir>): Promise<number> {
  const unique = new Set<string>();
  for (const dir of dirs) {
    const value = String(dir ?? '').trim();
    if (value) unique.add(value);
  }

  let written = 0;
  for (const dir of unique) {
    if (!(await Fs.exists(dir))) continue;
    if (!(await Fs.Is.dir(dir))) continue;
    await Pkg.Dist.compute({ dir, save: true });
    written += 1;
  }
  return written;
}
