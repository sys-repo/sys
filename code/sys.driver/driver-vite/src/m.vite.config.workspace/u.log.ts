import { clipLine } from '../m.fmt/u.ts';
import { Cli, Num, type t } from './common.ts';
import { Table } from './u.log.table.ts';

type ToStringOptions = { pad?: boolean; width?: number };

/**
 * Workspace logging helpers.
 */
export const Log: {
  toString(ws: t.ViteDenoWorkspace, options?: ToStringOptions): string;
} = {
  toString(ws: t.ViteDenoWorkspace, options: ToStringOptions = {}) {
    const width = wrangle.width(options.width);
    const lines: string[] = [];
    const push = (...parts: string[]) => lines.push(parts.join(''));

    push('Docs');
    push(`  Workspace <ESM Module> import-map${ws.filter ? ' (filtered)' : ''}`);
    push('');
    push(Table.toString(Table.rows(ws), width));

    const res = wrangle.clipBlock(lines.join('\n').trim(), width);
    return options.pad ? `\n${res}\n` : res;
  },
};

/**
 * Helpers:
 */
const wrangle = {
  width(input?: number) {
    return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : Cli.Fmt.Text.Width.fit();
  },

  clipBlock(text: string, width: number) {
    if (width <= 0) return '';
    return text.split('\n').map((line) => clipLine(line, width)).join('\n');
  },
} as const;
