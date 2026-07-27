import { clipLine } from '../m.fmt/u.ts';
import { c, Cli, type t } from './common.ts';

type Mode = 'verbose' | 'compact' | 'fit';
type Row = { specifier: string; path: string };
type Layout = { mode: Mode; leftWidth: number; pathWidth: number };

const INDENT = 2;
const TABLE_GAP = 2;
const ARROW = '→';
const HEADER = { left: 'Export', right: 'Maps to' } as const;
const PATH_FMT = { relative: 'prefixed', highlightBasename: false } as const;

/**
 * Workspace import-map table formatter.
 */
export const Table = {
  rows(ws: t.ViteDenoWorkspace): Row[] {
    return ws.aliases.map((alias) => ({
      specifier: String(alias.find),
      path: wrangle.relativePath(String(alias.replacement), ws.dir),
    }));
  },

  toString(rows: Row[], width: number) {
    const layout = wrangle.layout(rows, width);
    const table = Cli.table([]).padding(TABLE_GAP).indent(INDENT);

    table.push([
      c.gray(wrangle.clipPlain(HEADER.left, layout.leftWidth)),
      '',
      c.gray(wrangle.clipPlain(HEADER.right, layout.pathWidth)),
    ]);

    for (const row of rows) {
      table.push([wrangle.left(row, layout), c.green(ARROW), wrangle.path(row.path, layout)]);
    }

    return wrangle.clipBlock(String(table).trimEnd(), width);
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  relativePath(path: string, dir: string) {
    const root = dir.replace(/\/+$/, '');
    const prefix = `${root}/`;
    return path.startsWith(prefix) ? path.slice(prefix.length) : path;
  },

  layout(rows: Row[], width: number): Layout {
    const verbose = wrangle.naturalLayout(rows, 'verbose');
    if (wrangle.tableWidth(verbose) <= width) return verbose;

    const compact = wrangle.naturalLayout(rows, 'compact');
    if (wrangle.tableWidth(compact) <= width) return compact;

    return wrangle.fitLayout(rows, width);
  },

  naturalLayout(rows: Row[], mode: Exclude<Mode, 'fit'>): Layout {
    const left = [HEADER.left, ...rows.map((row) => wrangle.leftPlain(row, mode))];
    const paths = [HEADER.right, ...rows.map((row) => wrangle.pathFull(row.path))];
    return {
      mode,
      leftWidth: Cli.Fmt.Text.Width.max(left),
      pathWidth: Cli.Fmt.Text.Width.max(paths),
    };
  },

  fitLayout(rows: Row[], width: number): Layout {
    const compact = wrangle.naturalLayout(rows, 'compact');
    const fixed = INDENT + (TABLE_GAP * 2) + ARROW.length;
    const budget = Math.max(0, width - fixed);
    if (budget === 0) return { mode: 'fit', leftWidth: 0, pathWidth: 0 };

    let leftWidth = Math.min(
      compact.leftWidth,
      Math.max(Math.min(HEADER.left.length, budget), Math.floor(budget * 0.42)),
    );
    let pathWidth = Math.max(0, budget - leftWidth);

    const minPathWidth = Math.min(HEADER.right.length, budget);
    if (pathWidth < minPathWidth && leftWidth > 0) {
      const delta = Math.min(minPathWidth - pathWidth, leftWidth);
      leftWidth -= delta;
      pathWidth += delta;
    }

    return { mode: 'fit', leftWidth, pathWidth };
  },

  tableWidth(layout: Pick<Layout, 'leftWidth' | 'pathWidth'>) {
    return INDENT + layout.leftWidth + TABLE_GAP + ARROW.length + TABLE_GAP + layout.pathWidth;
  },

  left(row: Row, layout: Layout) {
    if (layout.mode === 'verbose') return `${c.gray('import ')}${c.white(row.specifier)}`;
    if (layout.mode === 'compact') return c.white(row.specifier);
    return wrangle.specifier(row.specifier, layout.leftWidth ?? 0);
  },

  leftPlain(row: Row, mode: Exclude<Mode, 'fit'>) {
    return mode === 'verbose' ? `import ${row.specifier}` : row.specifier;
  },

  specifier(input: string, width: number) {
    if (width <= 0) return '';
    if (Cli.Fmt.Text.Width.measure(input) <= width) return c.white(input);
    return Cli.Fmt.Text.ellipsize(input, width, {
      render: ({ head, ellipsis, tail }) => {
        return `${c.white(head)}${c.gray(ellipsis)}${c.white(tail)}`;
      },
    });
  },

  path(path: string, layout: Layout) {
    if (layout.mode !== 'fit') return wrangle.pathFull(path);
    const width = layout.pathWidth ?? 0;
    if (width <= 0) return '';
    return Cli.Fmt.Path.tty(path, {
      ...PATH_FMT,
      fit: 'width',
      terminal: false,
      width,
      min: 1,
    });
  },

  pathFull(path: string) {
    return Cli.Fmt.Path.str(path, PATH_FMT);
  },

  clipBlock(text: string, width: number) {
    if (width <= 0) return '';
    return text.split('\n').map((line) => clipLine(line, width)).join('\n');
  },

  clipPlain(input: string, width: number) {
    if (width <= 0) return '';
    if (Cli.Fmt.Text.Width.measure(input) <= width) return input;
    return Cli.Fmt.Text.ellipsize(input, width);
  },
} as const;
