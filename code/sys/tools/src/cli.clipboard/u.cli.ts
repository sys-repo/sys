import { type t, c, Fs, pkg } from './common.ts';

export const cli: t.VideoLib['cli'] = async (opts = {}) => {
  const dir = opts.dir ?? Fs.cwd('terminal');
};
