import { Fs, Path } from './common.ts';

export async function rewriteImport(args: {
  targetPath: string;
  pattern: RegExp;
  replacement: string;
}) {
  const { targetPath, pattern, replacement } = args;
  const path = Path.resolve(targetPath);
  const text = await Deno.readTextFile(path);
  const next = text.replace(pattern, replacement);

  if (text === next) return;
  await Fs.write(path, next);
}

export async function rewriteJson<T>(args: {
  targetPath: string;
  update: (current: T) => T;
}) {
  const { targetPath, update } = args;
  const path = Path.resolve(targetPath);
  const current = (await Fs.readJson<T>(path)).data;
  if (typeof current === 'undefined') return;
  const next = update(current);
  await Fs.write(path, JSON.stringify(next, null, 2) + '\n');
}
