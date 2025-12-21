import { type t, Fmt as Base, c, Cli, D, Fs, Str, Time } from './common.ts';
import { getConfig } from './u.config.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const config = await getConfig(cwd);
    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line();

    return String(str);
  },

  endpointTable(ref: t.DeployTool.Config.EndpointRef) {
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

    table.body([
      [c.gray(`Endpoint`), c.cyan(ref.name)],
      [child(`file`), c.gray(c.dim(ref.file))],
      [child(`created`), fmtTime(ref.createdAt)],
      [child(`last used`, true), fmtTime(ref.lastUsedAt)],
    ]);

    return Str.trimEdgeNewlines(String(table));
  },

  endpointValidation(
    check: t.DeployTool.EndpointsFs.YamlCheck,
    options?: {
      /** Max line width, including indentation (default 78). */
      readonly width?: number;
      /** Max number of errors to show (default 8). */
      readonly limit?: number;
    },
  ): string {
    if (check.ok) return '';

    const width = options?.width ?? 78;
    const limit = options?.limit ?? 8;

    const errors = check.errors ?? [];
    const count = errors.length;

    const fmtPath = (path?: t.ObjectPath) => {
      if (!path || path.length === 0) return '';
      return ` @ ${path.map((p) => String(p)).join('.')}`;
    };

    const oneLine = (s: string) =>
      String(s ?? '')
        .replace(/\s+/g, ' ')
        .trim();

    const wrap = (text: string, firstIndent: string, nextIndent: string) => {
      const maxFirst = Math.max(10, width - firstIndent.length);
      const maxNext = Math.max(10, width - nextIndent.length);

      const words = text.split(' ').filter(Boolean);
      const lines: string[] = [];

      let line = '';
      let max = maxFirst;

      for (const w of words) {
        const candidate = line ? `${line} ${w}` : w;

        if (candidate.length <= max) {
          line = candidate;
          continue;
        }

        if (!line) {
          // single giant token → hard cut
          lines.push(w.slice(0, max));
          const rest = w.slice(max);
          if (rest) words.unshift(rest);
        } else {
          lines.push(line);
          line = w;
        }

        max = maxNext;
      }

      if (line) lines.push(line);
      return lines.map((l, i) => `${i === 0 ? firstIndent : nextIndent}${l}`);
    };

    const b = Str.builder();
    b.line(c.yellow(`Errors (${count})`));

    const shown = errors.slice(0, limit);
    for (const e of shown) {
      const msg = oneLine(e?.message ?? '-');
      const at = fmtPath(e?.path);
      const full = `${msg}${at}`;

      const lines = wrap(full, c.yellow('- '), '  ');
      for (const line of lines) b.line(c.gray(line));
      b.line(); // spacer between errors
    }

    if (count > limit) {
      b.line(c.gray(c.dim(`… +${count - limit} more`)));
    }

    return Str.trimEdgeNewlines(String(b));
  },
} as const;
