import { Fmt as Base, Cli, c, pkg } from './common.ts';
import { Ffmpeg, fmtFfmpegInstall as ffmpegInstall } from './u.ffmpeg.ts';
import { buildProbeTable } from './u.fmt.probe.ts';

export const Fmt = {
  ...Base,
  buildProbeTable,
  ffmpegInstall,

  async help(toolname: string = 'Video Tools') {
    const table = Cli.table([]);
    const ffmpeg = await Ffmpeg.getVersion({ silent: true });

    const gr = c.gray;
    table.push([gr(` ├─ ${pkg.name}/video`), pkg.version]);
    table.push([gr(` └─ ${'ffmpeg'}`), ffmpeg.version]);

    return Base.builder()
      .line()
      .line(c.gray(`${c.green(toolname)} `))
      .line(table.toString().trim())
      .line()
      .toString();
  },
} as const;
