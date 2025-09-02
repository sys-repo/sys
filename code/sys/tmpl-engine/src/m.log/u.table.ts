import { type t, c, Cli, Path } from './common.ts';

export const table: t.TmplLogLib['table'] = (ops, options = {}) => {
  const tbl = Cli.table([]);
  const indent = options.indent ? ' '.repeat(options.indent) : '';
  if (ops.length === 0) return c.gray(c.italic(`${indent}No items to display`));

  // Default to trimming with baseDir when trimPathLeft isn't provided.
  const trimLeft = options.trimPathLeft ?? options.baseDir;

  // No dedupe needed with single-op-per-path; render in order given.
  for (const op of ops) {
    const path = wrangle.path(op, trimLeft);
    const action = wrangle.action(op);
    const note = wrangle.note(op, options);
    tbl.push([`${indent}${action}`, path, note]);
  }

  return tbl.toString().replace(/^\s*\n/, '');
};

/**
 * Helpers:
 */
const wrangle = {
  abs(op: t.TmplWriteOp, baseDir?: string) {
    const p = op.path;
    if (!p) return '';
    if (!Path.Is.absolute(p) && baseDir) return Path.resolve(baseDir, p); // ← Resolve to absolute if a baseDir is given and path is relative.
    return p;
  },

  path(op: t.TmplWriteOp, trimLeft?: string) {
    const abs = wrangle.abs(op, trimLeft);
    if (!abs) return '';
    const left = trimLeft ? Path.resolve(trimLeft) : undefined;
    const shown = left ? Path.relative(left, abs) : abs;
    return Cli.Format.path(shown, (e) => {
      if (e.is.basename) e.change(c.white(e.text));
      else e.change(c.gray(e.text));
    });
  },

  action(op: t.TmplWriteOp) {
    switch (op.kind) {
      case 'create':
        return c.green('Created');
      case 'modify':
        return c.yellow('Updated');
      case 'skip':
        return c.gray(c.dim(' n/a'));
      default:
        return c.gray('Unknown');
    }
  },

  note(op: t.TmplWriteOp, options: t.TmplLogTableOptions) {
    let text = '';
    const add = (v?: string) => (v ? (text ? (text += ' | ' + v) : (text = v)) : text);

    if (op.kind === 'skip') {
      add(op.reason ? `skipped: ${op.reason}` : 'skipped');
    } else {
      if (op.renamed) add(`renamed: ${op.renamed.from} → ${op.path}`);
      if (op.forced) add('forced');
    }
    if (op.dryRun) add(c.cyan('dry-run'));

    if (typeof options.note === 'function') add(options.note(op) || '');

    return text ? c.gray(`${c.white('←')} ${text}`) : '';
  },
} as const;
