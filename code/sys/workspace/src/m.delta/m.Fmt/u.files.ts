import { c, Cli, Str, type t } from './common.ts';

type FileLinesOptions = {
  readonly width: number;
  readonly rows: number;
  readonly maxFiles?: number;
};

type FileLayout = {
  readonly columns: 1 | 2;
  readonly visibleCount: number;
  readonly cellWidth: number;
};

const INDENT = '  ';
const MIN_TWO_COLUMN_CELL_WIDTH = 12;

/** Render package-relative changed-file lines with deterministic truncation. */
export function fileLines(
  pkgPath: t.StringPath,
  files: readonly t.StringPath[],
  options: FileLinesOptions,
) {
  return pathLines(files.map((file) => relativeToPackage(pkgPath, file)), options, {
    empty: 'no changed files mapped',
  });
}

/** Render skipped changed-file lines with deterministic truncation. */
export function skippedLines(skipped: readonly t.WorkspaceDelta.Skip[], options: FileLinesOptions) {
  return pathLines(skipped.map((skip) => `${skip.file} (${skip.reason})`), options);
}

/**
 * Helpers:
 */
function pathLines(
  paths: readonly string[],
  options: FileLinesOptions,
  text: { readonly empty?: string } = {},
) {
  const layout = resolveLayout(paths, options);
  const visible = paths.slice(0, layout.visibleCount);
  const remaining = paths.length - visible.length;
  const lines = renderVisible(visible, layout);

  if (remaining > 0) lines.push(`${INDENT}${moreText(remaining)}`);
  if (lines.length === 0 && text.empty) lines.push(`${INDENT}${c.gray(c.italic(text.empty))}`);
  return lines;
}

function renderVisible(paths: readonly string[], layout: FileLayout) {
  if (layout.columns === 1) {
    return paths.map((path) => `${INDENT}${pathText(path, layout.cellWidth)}`);
  }

  const rowCount = Math.ceil(paths.length / 2);
  const left = paths.slice(0, rowCount);
  const right = paths.slice(rowCount);
  const table = Cli.Table.create([]);

  for (let index = 0; index < rowCount; index++) {
    table.push([
      pathText(left[index] ?? '', layout.cellWidth),
      right[index] ? pathText(right[index], layout.cellWidth) : '',
    ]);
  }

  const text = Str.trimEdgeNewlines(String(table));
  return text.length === 0 ? [] : text.split('\n').map((line) => `${INDENT}${line.trimEnd()}`);
}

function resolveLayout(paths: readonly string[], options: FileLinesOptions): FileLayout {
  const rows = Math.max(0, options.rows);
  const explicitMax = options.maxFiles;
  const maxFiles = Math.max(0, explicitMax ?? rows * 2);
  const twoColumnRows = explicitMax === undefined ? rows : Math.ceil(maxFiles / 2);
  const twoColumnCount = Math.min(paths.length, maxFiles);
  const twoColumnWidth = twoColumnCellWidth(options.width);

  if (
    twoColumnCount > twoColumnRows &&
    twoColumnRows > 0 &&
    twoColumnWidth >= MIN_TWO_COLUMN_CELL_WIDTH
  ) {
    return { columns: 2, visibleCount: twoColumnCount, cellWidth: twoColumnWidth };
  }

  const oneColumnMax = explicitMax === undefined ? rows : maxFiles;
  return {
    columns: 1,
    visibleCount: Math.min(paths.length, oneColumnMax),
    cellWidth: oneColumnCellWidth(options.width),
  };
}

function oneColumnCellWidth(width: number) {
  return Math.max(1, width - INDENT.length);
}

function twoColumnCellWidth(width: number) {
  return Math.max(0, Math.floor((width - INDENT.length - Cli.Table.cellGap) / 2));
}

function pathText(path: string, width: number) {
  return Cli.Fmt.Path.tty(path, {
    fit: 'width',
    width,
    min: 1,
    highlightBasename: false,
    relative: 'bare',
    tone: 'muted',
  });
}

function moreText(count: number) {
  return c.dim(c.italic(c.cyan(`+${count} more`)));
}

function relativeToPackage(pkgPath: t.StringPath, file: t.StringPath) {
  if (file === pkgPath) return '.';
  const prefix = `${pkgPath}/`;
  return file.startsWith(prefix) ? file.slice(prefix.length) : file;
}
