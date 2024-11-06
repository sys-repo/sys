import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { copyDir } from './u.copy.dir.ts';
import { copyFile } from './u.copy.file.ts';

export { copyDir, copyFile };

/**
 * Copy a file or directory.
 */
export const copy: t.FsCopy = async (from, to, options) => {
  return (await Is.dir(from))
    ? //
      copyDir(from, to, options)
    : copyFile(from, to, options);
};
