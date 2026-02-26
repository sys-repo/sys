import { c, Cli, Fs, Str, Time } from '../common.ts';
import type * as h from './t.ts';

export const HashFmt = {
  result(res: h.HashRunResult): string {
    const tbl = Cli.table([]);
    const digest = `${res.digest.slice(0, -5)}${c.green(res.digest.slice(-5))}`;
    const elapsed = String(Time.elapsed(res.computedAt));
    const built = elapsed === 'just now' ? 'just now' : `${elapsed} ago`;

    tbl.push([c.gray(' hash'), c.gray(digest)]);
    tbl.push([c.gray(' dir'), c.gray(Fs.trimCwd(res.targetDir))]);
    tbl.push([c.gray(' files'), c.gray(String(res.fileCount))]);
    tbl.push([c.gray(' bytes'), c.gray(Str.bytes(res.bytesTotal))]);
    tbl.push([c.gray(' built'), c.gray(built)]);
    return String(tbl);
  },
} as const;
