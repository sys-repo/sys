import { type t, c, FileMap, Fs, Path } from './common.ts';

export const bundle: t.TmplKernel['bundle'] = async (b) => {
  const src = Path.resolve(b.srcDir);
  const out = Path.resolve(b.outFile);
  const filter = b.filter ?? (() => true);
  const sort = b.sortKeys ?? ((keys: readonly string[]) => [...keys].sort());

  const map = await FileMap.bundle(src, filter);
  const keys = sort(Object.keys(map));

  const sorted: t.FileMap = {};
  for (const k of keys) sorted[k] = map[k];

  await Fs.ensureDir(Path.dirname(out));
  await Fs.writeJson(out, sorted);

  const rel = Path.relative('.', out);
  console.info(c.gray(`${c.green('Wrote')} ${rel} (${c.white(String(keys.length))} entries)`));
  console.info();

  return { fileMap: sorted, outFile: out, count: keys.length };
};
