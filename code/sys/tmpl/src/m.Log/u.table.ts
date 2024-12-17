import { type t, c, Cli } from './common.ts';

export const table: t.TmplLogLib['table'] = (ops, options = {}) => {
  const table = Cli.table([]);
  const indent = options.indent ? ' '.repeat(options.indent) : '';
  ops
    .filter((op) => (options.hideExcluded ? !op.excluded : true))
    .forEach((op) => {
      const path = wrangle.path(op);
      const action = wrangle.action(op);
      const note = wrangle.note(op);
      table.push([`${indent}${action}`, path, note]);
    });
  return table.toString().replace(/^\s*\n/, '');
};

/**
 * Helpers
 */
const wrangle = {
  path(op: t.TmplFileOperation) {
    const file = op.file.target;
    const text = c.gray(`${file.dir}/${c.white(file.name)}`);
    return op.excluded ? c.dim(text) : text;
  },
  action(op: t.TmplFileOperation) {
    if (op.excluded) return c.gray(c.dim(''));
    if (op.created) return c.green('Created');
    if (op.updated) return c.yellow('Updated');
    return c.gray('Unchanged');
  },
  note(op: t.TmplFileOperation) {
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
    return text ? c.gray(`${c.white('←')} ${text}`) : '';
  },
} as const;

const is = {
  dryRun(op: t.TmplFileOperation) {
    return !op.written && (op.created || op.updated);
  },
} as const;
