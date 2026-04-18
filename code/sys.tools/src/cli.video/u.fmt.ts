import { Fmt as Base, Cli, Str, c, pkg } from './common.ts';
import { Ffmpeg, fmtFfmpegInstall as ffmpegInstall } from './u.ffmpeg.ts';
import { buildProbeTable } from './u.fmt.probe.ts';

export const Fmt = {
  ...Base,
  buildProbeTable,
  ffmpegInstall,

  async help() {
    const cmd = Base.invoke('video');
    const table = Cli.table([]);
    const ffmpeg = await Ffmpeg.getVersion({ silent: true });

    const gr = c.gray;
    table.push([gr(` ├─ ${pkg.name}`), pkg.version]);
    table.push([gr(` └─ ${'ffmpeg'}`), ffmpeg.version]);

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(cmd)} `))
      .line(table.toString().trim())
      .line()
      .toString();
  },
} as const;
