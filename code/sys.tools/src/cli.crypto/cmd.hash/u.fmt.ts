import { type t, c, Cli, Fmt, Fs, Str, Time } from '../common.ts';

export const HashFmt = {
  dirLabel(path: string) {
    const label = Fs.Path.trimCwd(path, { prefix: true }) || './';
    return label.endsWith('/') ? label : `${label}/`;
  },

  spinnerText(dir: string) {
    return Fmt.spinnerText(`hashing ${c.cyan(HashFmt.dirLabel(dir))}`);
  },

  spinnerProgressText(dir: string, current: number, total: number) {
    const progress = c.gray(`(${c.white(current.toLocaleString())} of ${total.toLocaleString()} files)`);
    return Fmt.spinnerText(`hashing ${c.cyan(HashFmt.dirLabel(dir))} ${progress}`);
  },

  preflightSummary(summary: t.HashPreflight) {
    return `${summary.fileCount.toLocaleString()} ${Str.plural(summary.fileCount, 'file')}, ${Str.bytes(summary.bytesTotal)}`;
  },

  preflightWarning(summary: t.HashPreflight) {
    return `Large target detected (estimate): ${c.cyan(HashFmt.preflightSummary(summary))}`;
  },

  preflightJunk(summary: t.HashPreflight) {
    if (summary.junkFiles.length === 0) return '';
    const files = summary.junkFiles
      .map((path) => `  ${HashFmt.pathLabel(path)}`)
      .join('\n');
    return `Delete before calculating:\n${files}`;
  },

  pathLabel(path: string) {
    return Fs.Path.trimCwd(path, { prefix: true }) || './';
  },

  result(
    res: t.HashRunResult,
    opts: {
      elapsed?: string;
      dirLabel?: string;
      dist?: t.HashDistRow;
    } = {},
  ): string {
    const tbl = Cli.table([]);
    const digest = `${res.digest.slice(0, -5)}${c.green(res.digest.slice(-5))}`;
    const elapsed = opts.elapsed ?? String(Time.elapsed(res.computedAt));
    const dirLabel = opts.dirLabel ?? HashFmt.dirLabel(res.targetDir);

    tbl.push([c.gray('  hash'), c.white(digest)]);
    tbl.push([c.gray('  dir'), c.gray(dirLabel)]);
    if (opts.dist) {
      const path = Fmt.prettyPath(HashFmt.pathLabel(opts.dist.path));
      const digestShort = ` ${Fmt.hashSuffix(res.digest)}`;
      const status = wrangle.distStatus(opts.dist.status);
      const size = wrangle.distSize(opts.dist.sizeBytes);
      tbl.push([c.gray('  dir:dist'), `${path}${digestShort}${status}${size}`]);
    }
    tbl.push([
      c.gray('  dir:files'),
      c.gray(`${res.fileCount.toLocaleString()} ${Str.plural(res.fileCount, 'file')}, ${Str.bytes(res.bytesTotal)}`),
    ]);
    tbl.push([c.gray('  elapsed'), c.gray(elapsed)]);

    return Str.trimEdgeNewlines(String(tbl));
  },
} as const;

const wrangle = {
  distSize(sizeBytes?: t.NumberBytes) {
    if (sizeBytes === undefined) return '';
    return c.gray(`, ${Str.bytes(sizeBytes)}`);
  },

  distStatus(status?: t.HashDistRowStatus) {
    if (!status) return '';
    if (status === 'created' || status === 'changed') return ` ${c.green(`(${status})`)}`;
    return ` ${c.yellow(`(${status})`)}`;
  },
} as const;
