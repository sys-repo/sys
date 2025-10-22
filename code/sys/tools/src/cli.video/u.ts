import { Path } from './common.ts';

/** Swap a file's extension using your Path API. */
export const replaceExt = (file: string, toExt: string) => {
  const dir = Path.dirname(file);
  const stem = Path.basename(file, Path.extname(file));
  return Path.join(dir, `${stem}${toExt}`);
};
