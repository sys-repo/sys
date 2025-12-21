import { type t, Fmt as Base, c, Cli, D, Fs, Str, Time } from '../common.ts';
import { getConfig } from '../u.config.ts';
import { endpointValidation } from './u.fmt.validation.ts';

export const Fmt = {
  ...Base,
  endpointValidation,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const config = await getConfig(cwd);
    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line();

    return String(str);
  },

  async endpointTable(cwd: t.StringDir, ref: t.DeployTool.Config.EndpointRef) {
    const table = Cli.table();

    const fmtTime = (ts?: t.UnixTimestamp) => {
      if (!ts) return c.gray(c.dim('-'));
      try {
        return c.gray(`${String(Time.elapsed(ts))} ago`);
      } catch {
        return c.gray(String(ts));
      }
    };

    const child = (label: string, isLast = false) => {
      return c.gray(` ${c.dim(Fmt.Tree.branch(isLast))} ${label}`);
    };

    // Never feed Ansi helpers undefined.
    const name = String(ref.name ?? '');
    const file = String(ref.file ?? '');

    table.body([
      [c.gray(`Endpoint`), c.cyan(name)],
      [child(`file`), c.gray(c.dim(file))],
      [child(`created`), fmtTime(ref.createdAt)],
      [child(`last used`, true), fmtTime(ref.lastUsedAt)],
    ]);

    let mappingsBlock = '';

    try {
      const abs = Fs.join(cwd, file);
      const res = await Fs.readYaml<{ mappings?: readonly t.DeployTool.Staging.Mapping[] }>(abs);
      const mappings = res.ok ? (res.data?.mappings ?? []) : [];

      if (mappings.length) {
        const mt = Cli.table();
        const maxModeLen = mappings.reduce((m, x) => {
          const mode = String(x.mode ?? '');
          return Math.max(m, mode.length);
        }, 0);

        const flowFor = (m: t.DeployTool.Staging.Mapping) => {
          const srcBase = Fs.basename(String(m.dir.source ?? ''));
          const staging = String(m.dir.staging ?? '');
          return `${c.white(srcBase)}\n${c.green('↓')}\n${c.white(staging)}`;
        };

        mt.body(
          mappings.map((m: t.DeployTool.Staging.Mapping) => {
            const mode = String(m.mode ?? '');
            const pad = ' '.repeat(Math.max(0, maxModeLen - mode.length));
            return [` • ${c.cyan(mode)}${pad}`, flowFor(m)];
          }),
        );

        mappingsBlock = String(
          Str.builder()
            .blank()
            .line(Str.trimEdgeNewlines(String(mt))),
        );
      }
    } catch {
      // formatting must never throw
    }

    const str = Str.builder()
      .line(Str.trimEdgeNewlines(String(table)))
      .line(mappingsBlock);
    return String(str);
  },
} as const;
