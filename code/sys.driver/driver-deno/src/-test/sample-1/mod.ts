import { Fs, Tmpl } from '../common.ts';

export const tmpl = () => {
  const dir = Fs.resolve('./src/-test/sample-1/-files');
  return Tmpl.create(dir, (e) => {});
};
