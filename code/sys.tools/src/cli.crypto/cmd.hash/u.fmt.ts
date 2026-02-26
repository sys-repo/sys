import { c, Cli, Fmt, Fs, Str, Time } from '../common.ts';
import type * as h from './t.ts';

export const HashFmt = {
  spinnerText(dirLabel: string) {
    return Fmt.spinnerText(`hashing ${c.cyan(dirLabel)} ${c.dim('...')}`);
  },

  result(res: h.HashRunResult, opts: { elapsed?: string; dirLabel?: string } = {}): string {
    const tbl = Cli.table([]);
    const digest = `${res.digest.slice(0, -5)}${c.green(res.digest.slice(-5))}`;
    const elapsed = opts.elapsed ?? String(Time.elapsed(res.computedAt));
    const dirLabel = opts.dirLabel ?? (Fs.trimCwd(res.targetDir) || './');

    tbl.push([c.gray(' hash'), c.gray(digest)]);
    tbl.push([c.gray(' dir'), c.gray(dirLabel)]);
    tbl.push([c.gray(' files'), c.gray(res.fileCount.toLocaleString())]);
    tbl.push([c.gray(' bytes'), c.gray(Str.bytes(res.bytesTotal))]);
    tbl.push([c.gray(' elapsed'), c.gray(elapsed)]);
    return String(tbl);
  },
} as const;
