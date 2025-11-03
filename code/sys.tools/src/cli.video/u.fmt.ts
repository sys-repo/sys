import { Fmt as Base, Cli, D, Str, c, pkg } from './common.ts';
import { Ffmpeg, fmtFfmpegInstall as ffmpegInstall } from './u.ffmpeg.ts';
import { buildProbeTable } from './u.fmt.probe.ts';

export const Fmt = {
  ...Base,
  buildProbeTable,
  ffmpegInstall,

  async help(toolname: string = D.toolname) {
    const table = Cli.table([]);
    const ffmpeg = await Ffmpeg.getVersion({ silent: true });

    const gr = c.gray;
    table.push([gr(` ├─ ${pkg.name}`), pkg.version]);
    table.push([gr(` └─ ${'ffmpeg'}`), ffmpeg.version]);

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(toolname)} `))
      .line(table.toString().trim())
      .line()
      .toString();
  },
} as const;
