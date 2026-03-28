import { c } from '../common.ts';
import type { CliFormatCommitLib } from './t.commit.ts';

export const Commit: CliFormatCommitLib = {
  suggestion(message, options = {}) {
    const title = options.title ?? 'suggested commit msg:';
    const indent = Math.max(0, options.indent ?? 0);
    const pad = ' '.repeat(indent);
    const lines = [];
    const tone = options.message ?? {};
    const color = tone.color ?? 'white';
    const bold = tone.bold ?? false;
    const italic = tone.italic ?? false;

    if (title !== false) lines.push(c.bold(c.brightCyan(title)));
    let msg = c[color](message);
    if (italic) msg = c.italic(msg);
    if (bold) msg = c.bold(msg);
    lines.push(msg);

    return lines.map((line) => `${pad}${line}`).join('\n');
  },
};
