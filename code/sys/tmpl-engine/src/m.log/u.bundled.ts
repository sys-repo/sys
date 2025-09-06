import { type t, c, Fs, Str } from './common.ts';

export const bundled: t.TmplLogLib['bundled'] = (bundle) => {
  const prefix = `${c.green('Wrote')} bundle to:`;
  const path = c.gray(Fs.trimCwd(bundle.file));
  const total = `${bundle.count} ${Str.plural(bundle.count, 'file', 'files')}`;
  return `${prefix} ${path} (${total})`;
};
