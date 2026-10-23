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
