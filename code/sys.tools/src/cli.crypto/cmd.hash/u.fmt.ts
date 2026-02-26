import { type t, c, Cli, Fmt, Fs, Str, Time } from '../common.ts';

export const HashFmt = {
  dirLabel(path: string) {
    const label = Fs.Path.trimCwd(path, { prefix: true }) || './';
    return label.endsWith('/') ? label : `${label}/`;
  },

  spinnerText(dir: string) {
    return Fmt.spinnerText(`hashing ${c.cyan(HashFmt.dirLabel(dir))}`);
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
      tbl.push([c.gray('  dist'), `${path}${digestShort}${status}`]);
    }
    tbl.push([c.gray('  files'), c.gray(res.fileCount.toLocaleString())]);
    tbl.push([c.gray('  bytes'), c.gray(Str.bytes(res.bytesTotal))]);
    tbl.push([c.gray('  elapsed'), c.gray(elapsed)]);

    return Str.trimEdgeNewlines(String(tbl));
  },
} as const;

const wrangle = {
  distStatus(status?: t.HashDistRowStatus) {
    if (!status) return '';
    if (status === 'created' || status === 'changed') return ` ${c.green(`(${status})`)}`;
    return ` ${c.yellow(`(${status})`)}`;
  },
} as const;
