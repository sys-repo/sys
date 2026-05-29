import { c, Cli, Str, type t } from './common.ts';

type FileLinesOptions = {
  readonly width: number;
  readonly rows: number;
  readonly maxFiles?: number;
};

type FileLayout = {
  readonly columns: 1 | 2;
  readonly visibleCount: number;
};

const INDENT = '  ';
const COLUMN_GAP = 3;

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
  if (layout.columns === 1) return paths.map((path) => `${INDENT}${pathText(path)}`);

  const rowCount = Math.ceil(paths.length / 2);
  const left = paths.slice(0, rowCount);
  const right = paths.slice(rowCount);
  const table = Cli.Table.create([]);

  for (let index = 0; index < rowCount; index++) {
    table.push([pathText(left[index] ?? ''), right[index] ? pathText(right[index]) : '']);
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

  if (
    twoColumnCount > twoColumnRows && fitsTwoColumns(paths.slice(0, twoColumnCount), {
      rows: twoColumnRows,
      width: options.width,
    })
  ) {
    return { columns: 2, visibleCount: twoColumnCount };
  }

  const oneColumnMax = explicitMax === undefined ? rows : maxFiles;
  return { columns: 1, visibleCount: Math.min(paths.length, oneColumnMax) };
}

function fitsTwoColumns(
  paths: readonly string[],
  options: { readonly rows: number; readonly width: number },
) {
  if (options.rows <= 0) return false;
  const left = paths.slice(0, options.rows);
  const right = paths.slice(options.rows);
  if (right.length === 0) return false;

  const needed = INDENT.length + maxWidth(left) + COLUMN_GAP + maxWidth(right);
  return needed <= options.width;
}

function maxWidth(paths: readonly string[]) {
  return paths.reduce((max, path) => Math.max(max, Cli.stripAnsi(path).length), 0);
}

function pathText(path: string) {
  return c.gray(path);
}

function moreText(count: number) {
  return c.italic(c.cyan(`+${count} more`));
}

function relativeToPackage(pkgPath: t.StringPath, file: t.StringPath) {
  if (file === pkgPath) return '.';
  const prefix = `${pkgPath}/`;
  return file.startsWith(prefix) ? file.slice(prefix.length) : file;
}
