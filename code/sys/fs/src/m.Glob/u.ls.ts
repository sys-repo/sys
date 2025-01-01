import { type t } from './common.ts';
import { create } from './u.create.ts';

/**
 * List the file-paths within a directory (simple glob).
 */
export const ls: t.FsLib['ls'] = async (dir: t.StringDir, opt = {}) => {
  const options = { includeDirs: false, ...opt };
  const files = await create(dir, options).find('**');
  return files.map((m) => m.path);
};
