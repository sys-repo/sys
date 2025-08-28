import { type t, c, Cli } from './common.ts';
import { normalizeOps } from './u.normalize.ts';

export const table: t.TmplLogLib['table'] = (ops, options = {}) => {
  const table = Cli.table([]);
  const indent = options.indent ? ' '.repeat(options.indent) : '';

  if (ops.length === 0) {
    return c.gray(c.italic(`${indent}No items to display`));
  }

  normalizeOps(ops, options.baseDir)
    .filter((op) => (options.hideExcluded ? !op.excluded : true))
    .forEach((op) => {
      const path = wrangle.path(op, options.trimPathLeft);
      const action = wrangle.action(op);
      const note = wrangle.note(op, options);
      table.push([`${indent}${action}`, path, note]);
    });

  return table.toString().replace(/^\s*\n/, '');
};

/**
 * Helpers
 */
const wrangle = {
  path(op: t.TmplFileOperation, trimBase?: t.StringPath) {
    const target = op.file.target;
    let text = '';
    if (target.dir) text += `${target.dir}/`;
    text += c.white(target.file.name);
    text = c.gray(text);
    return op.excluded ? c.dim(text) : text;
  },

  action(op: t.TmplFileOperation) {
    if (op.excluded) return c.gray(c.dim(' n/a'));
    if (op.created) return c.green('Created');
    if (op.updated) return c.yellow('Updated');
    return c.gray('Unchanged');
  },

  note(op: t.TmplFileOperation, options: t.TmplLogTableOptions) {
    let text = '';
    const append = (value: string) => {
      if (text) text += ' | ';
      text += value;
      return text;
    };
    if (op.excluded) {
      const base = 'excluded';
      const reason = typeof op.excluded === 'object' ? op.excluded.reason : '';
      append(reason ? `${base}: ${reason}` : base);
    }
    if (op.forced && !op.excluded) {
      append(c.yellow('forced'));
    }
    if (is.dryRun(op)) {
      append(`(${c.cyan('dry-run')})`);
    }
    if (typeof options.note === 'function') {
      const note = options.note(op);
      if (note) append(note);
    }
    return text ? c.gray(`${c.white('←')} ${text}`) : '';
  },
} as const;

const is = {
  dryRun(op: t.TmplFileOperation) {
    return !op.written && (op.created || op.updated);
  },
} as const;
