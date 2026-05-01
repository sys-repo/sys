import { type t, c, Cli, Is, Path } from './common.ts';

export const table: t.TmplLogLib['table'] = (ops, opt) => {
  const options = wrangle.options(opt);
  const tbl = Cli.table([]);
  const indent = options.indent ? ' '.repeat(options.indent) : '';
  const visibleOps = wrangle.ops(ops, options);
  if (visibleOps.length === 0) return c.gray(c.italic(`${indent}No items to display`));

  // Default to trimming with baseDir when trimPathLeft isn't provided.
  const trimLeft = options.trimPathLeft ?? options.baseDir;

  // No dedupe needed with single-op-per-path; render in order given.
  for (const op of visibleOps) {
    const path = wrangle.path(op, options, trimLeft);
    const action = wrangle.action(op, options);
    const note = wrangle.note(op, options);
    tbl.push([`${indent}${action}`, path, note]);
  }

  return tbl.toString().replace(/^\s*\n/, '');
};

/**
 * Helpers:
 */
const wrangle = {
  options(input?: Parameters<t.TmplLogLib['table']>[1]): t.TmplLogTableOptions {
    if (!input) return {};
    if (Is.string(input)) return { baseDir: input };
    return input;
  },

  ops(ops: readonly t.TmplWriteOp[], options: t.TmplLogTableOptions) {
    return options.hideSkipped ? ops.filter((op) => op.kind !== 'skip') : ops;
  },

  abs(op: t.TmplWriteOp, baseDir?: string) {
    const p = op.path;
    if (!p) return '';
    if (!Path.Is.absolute(p) && baseDir) return Path.resolve(baseDir, p); // ← Resolve to absolute if a baseDir is given and path is relative.
    return p;
  },

  path(op: t.TmplWriteOp, options: t.TmplLogTableOptions, trimLeft?: string) {
    const abs = wrangle.abs(op, trimLeft);
    if (!abs) return '';
    const left = trimLeft ? Path.resolve(trimLeft) : undefined;
    const shown = left ? Path.relative(left, abs) : abs;
    const relative = !!left || !Path.Is.absolute(op.path);
    const path = wrangle.prefixRelativePath(shown, options, relative);
    return Cli.Fmt.path(path, (e) => {
      if (e.is.basename) e.change(c.white(e.part));
      else e.change(c.gray(e.part));
    });
  },

  action(op: t.TmplWriteOp, options: t.TmplLogTableOptions) {
    const kind = wrangle.actionKind(op, options);
    let text = c.gray('Unknown');
    if (op.kind === 'create') text = c.green(kind);
    if (op.kind === 'modify') text = c.yellow(kind);
    if (op.kind === 'skip') text = c.gray(c.dim(kind));
    if (op.dryRun) text = c.dim(text);
    return text;
  },

  actionKind(op: t.TmplWriteOp, options: t.TmplLogTableOptions) {
    if (options.actionLabel === 'kind') return op.kind;
    if (op.kind === 'create') return 'created';
    if (op.kind === 'modify') return 'updated';
    if (op.kind === 'skip') return 'skipped';
    return 'Unknown';
  },

  prefixRelativePath(path: string, options: t.TmplLogTableOptions, relative: boolean) {
    const prefix = options.relativePathPrefix;
    if (!relative || prefix === false || !prefix || path.startsWith(prefix)) return path;
    if (!path || path === '.') return path;
    return `${prefix}${path}`;
  },

  note(op: t.TmplWriteOp, options: t.TmplLogTableOptions) {
    let text = '';
    const add = (v?: string) => (v ? (text ? (text += ' | ' + v) : (text = v)) : text);

    if (op.kind === 'skip') {
      add(op.reason ? `${op.reason}` : 'skipped');
    } else {
      if (op.renamed && !op.renamed.silent) add(`renamed: ${op.renamed.from} → ${op.path}`);
      if (op.forced) add('forced');
    }
    if (op.dryRun && options.showDryRunNote !== false) add(c.yellow('dry-run'));

    if (typeof options.note === 'function') add(options.note(op) || '');

    return text ? c.gray(`${c.gray('←')} ${text}`) : '';
  },
};
