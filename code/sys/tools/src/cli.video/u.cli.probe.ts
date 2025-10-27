import { type t, c, Fs } from './common.ts';
import { probeVideo } from './u.file.probe.ts';
import { selectFiles } from './u.file.select.ts';
import { Fmt } from './u.fmt.ts';

export async function selectAndProbe(args: { dir: t.StringDir }) {
  const { dir } = args;
  const sources = await selectFiles(dir);
  if (sources.length === 0) return void console.info(c.yellow('No files selected'));

  for (const src of sources) {
    const info = await probeVideo(src);
    const title = c.cyan('Video');
    const path = Fs.trimCwd(info.path, { prefix: true });

    console.info();
    console.info(c.gray(`${title} ${path}`));
    console.info(Fmt.buildProbeTable(info, { indent: 2 }));
  }
}
