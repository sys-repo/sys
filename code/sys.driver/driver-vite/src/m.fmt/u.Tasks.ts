import type { t } from './common.ts';
import { c, Text } from '@sys/cli/fmt';
import { clipLine, clipText, outputWidth, reserveWidth } from './u.ts';

type C = (str: string) => string;
type Cmd = t.ViteLog.Tasks.Cmd;
type LeftMode = 'full' | 'compact';
type Row = { cmd: Cmd; description: string } | 'break';

const GAP = 2;
const ROWS: readonly Row[] = [
  { cmd: 'dev', description: 'Run the development server.' },
  { cmd: 'build', description: 'Transpile to production bundle.' },
  { cmd: 'serve', description: 'Serve build on HTTP server.' },
  'break',
  { cmd: 'clean', description: 'Delete temporary files.' },
  { cmd: 'info', description: 'Show info.' },
];

export const Tasks: t.ViteLog.Tasks.Lib = {
  log(args = {}) {
    console.info(Tasks.toString(args));
  },

  toString(args = {}) {
    const { cmd, minimal = true } = args;
    const width = outputWidth(args.width);
    const rows = wrangle.rows(minimal);
    const mode = wrangle.leftMode(rows, args, width);
    const usage = wrangle.usage(cmd, width);
    const table = wrangle.table(rows, args, mode, width);
    const footnote = wrangle.footnote(args, width);
    return footnote ? [usage, '', table, footnote].join('\n') : [usage, '', table].join('\n');
  },
};

/**
 * Helpers:
 */
const wrangle = {
  rows(minimal: boolean) {
    return minimal ? ROWS.filter((row) => row !== 'break' && row.cmd !== 'clean') : ROWS;
  },

  usage(cmd: string | undefined, width: number) {
    const COMMAND = `[${c.bold('COMMAND')}]`;
    const value = c.gray(`Usage: ${c.green(`deno task ${cmd ? c.bold(cmd) : COMMAND}`)}`);
    return clipLine(value, width);
  },

  table(rows: readonly Row[], args: t.ViteLog.Tasks.Args, mode: LeftMode, width: number) {
    const leftWidth = wrangle.leftWidth(rows, args, mode);
    const rendered = rows.map((row) => {
      if (row === 'break') return '';
      return wrangle.row(row, args, mode, width, leftWidth);
    });
    return rendered.join('\n').trimEnd();
  },

  row(
    row: Exclude<Row, 'break'>,
    args: t.ViteLog.Tasks.Args,
    mode: LeftMode,
    width: number,
    leftWidth: number,
  ) {
    const left = Text.Width.padEnd(wrangle.left(row.cmd, args, mode), leftWidth);
    const descWidth = reserveWidth(width, leftWidth + GAP);
    const desc = wrangle.description(row.cmd, row.description, args, descWidth);
    const gap = ' '.repeat(GAP);
    return clipLine(`${left}${gap}${desc}`.trimEnd(), width);
  },

  left(cmd: Cmd, args: t.ViteLog.Tasks.Args, mode: LeftMode) {
    const isDisabled = args.disabled?.includes(cmd) ?? false;
    let name = wrangle.cmdColor(cmd, args)(cmd);
    if (args.cmd === cmd) name = c.bold(name);
    const prefix = mode === 'full' ? '  deno task ' : '  ';
    const suffix = isDisabled ? c.yellow('*') : '';
    return `${c.gray(prefix)}${name}${suffix}`;
  },

  leftWidth(rows: readonly Row[], args: t.ViteLog.Tasks.Args, mode: LeftMode) {
    const cells = rows.flatMap((row) => row === 'break' ? [] : [wrangle.left(row.cmd, args, mode)]);
    return Text.Width.max(cells);
  },

  description(cmd: Cmd, text: string, args: t.ViteLog.Tasks.Args, width: number) {
    const color = !args.cmd || args.cmd === cmd ? c.white : c.gray;
    return color(clipText(text, width));
  },

  leftMode(rows: readonly Row[], args: t.ViteLog.Tasks.Args, width: number): LeftMode {
    const leftWidth = wrangle.leftWidth(rows, args, 'full');
    const descWidth = reserveWidth(width, leftWidth + GAP);
    const fullFits = rows.every((row) => {
      if (row === 'break') return true;
      return Text.Width.measure(row.description) <= descWidth;
    });
    return fullFits ? 'full' : 'compact';
  },

  cmdColor(cmd: Cmd, args: t.ViteLog.Tasks.Args): C {
    const isDisabled = args.disabled?.includes(cmd) ?? false;
    const active = cmd === args.cmd || !args.cmd;
    const fmt = active ? c.green : c.gray;
    return isDisabled ? (str) => c.strikethrough(c.dim(fmt(str))) : fmt;
  },

  footnote(args: t.ViteLog.Tasks.Args, width: number) {
    const disabled = args.disabled ?? [];
    if (disabled.length === 0) return '';
    return clipLine(c.yellow(`* TODO 🐷 ${c.italic('(implemention in progress)')}`), width);
  },
} as const;
