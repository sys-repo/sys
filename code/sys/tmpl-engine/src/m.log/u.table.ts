import { type t, c, Cli, Is, Path } from './common.ts';

export const table: t.TmplLogLib['table'] = (ops, opt) => {
  const options = wrangle.options(opt);
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
  options(input?: Parameters<t.TmplLogLib['table']>[1]): t.TmplLogTableOptions {
    if (!input) return {};
    if (Is.string(input)) return { baseDir: input };
    return input;
  },

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
    let text = c.gray('Unknown');
    if (op.kind === 'create') text = c.green('created');
    if (op.kind === 'modify') text = c.yellow('updated');
    if (op.kind === 'skip') text = c.gray(c.dim('skipped'));
    if (op.dryRun) text = c.dim(text);
    return text;
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
    if (op.dryRun) add(c.yellow('dry-run'));

    if (typeof options.note === 'function') add(options.note(op) || '');

    return text ? c.gray(`${c.gray('←')} ${text}`) : '';
  },
};
