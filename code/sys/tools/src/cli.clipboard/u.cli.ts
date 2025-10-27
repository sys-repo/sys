import { type t, Fmt, Fs } from './common.ts';

export const cli: t.ClipboardLib['cli'] = async (opts = {}) => {
  const toolname = 'Clipboard';
  const dir = opts.dir ?? Fs.cwd('terminal');

  console.info();
  console.info(await Fmt.header(toolname, dir));
  console.info();


  console.info();
  console.info(Fmt.signoff(toolname));
};
