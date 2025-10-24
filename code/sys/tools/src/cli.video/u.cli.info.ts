import { type t, c, Cli, Fs } from './common.ts';
import { selectFiles } from './u.file.select.ts';

export async function selectAndProbe(args: { dir: t.StringDir }) {
  const { dir } = args;
  const sources = await selectFiles(dir);
  if (sources.length === 0) return void console.info(c.yellow('No files selected'));

}
