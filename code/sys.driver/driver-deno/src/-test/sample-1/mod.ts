import { Fs, TmplEngine } from '../common.ts';

export const tmpl = () => {
  const dir = Fs.resolve('./src/-test/sample-1/-files');
  return TmplEngine.makeTmpl(dir, (e) => {});
};
