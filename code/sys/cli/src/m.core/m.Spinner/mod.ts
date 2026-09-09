import process from 'node:process';
import ora from 'ora';
import type { t } from '../common.ts';

const create: t.CliSpinner.Lib['create'] = (text = '', options = {}) => {
  const output = options.target === 'stdout'
    ? { stream: process.stdout }
    : options.target === 'stderr'
    ? { stream: process.stderr }
    : {};
  return ora({
    text,
    ...output,
    // Important: do NOT let Ora grab stdin in the Node-compat layer.
    // This avoids the “first Ctrl+C cancels spinner, second exits” effect.
    discardStdin: false,
  });
};

const start: t.CliSpinner.Lib['start'] = (text = '', options = {}) => {
  return startWith(create, text, options);
};

/**
 * Tools for working with a CLI spinner.
 */
export const Spinner: t.CliSpinner.Lib = Object.freeze({
  create,
  start,
  async with<T>(
    text: string,
    run: (spinner: t.CliSpinner.Instance) => Promise<T>,
    options = {},
  ) {
    return await withSpinner(start, text, run, options);
  },
});

/** Package-internal spinner-start dependency seam. */
export function startWith(
  createSpinner: t.CliSpinner.Lib['create'],
  text = '',
  options: t.CliSpinner.Options = {},
): t.CliSpinner.Instance {
  const { silent = false } = options;
  const spinner = createSpinner(text, options);
  if (!silent) spinner.start();
  return spinner;
}

/** Package-internal async spinner dependency seam. */
export async function withSpinner<T>(
  startSpinner: t.CliSpinner.Lib['start'],
  text: string,
  run: (spinner: t.CliSpinner.Instance) => Promise<T>,
  options: t.CliSpinner.Options = {},
): Promise<T> {
  const spinner = startSpinner(text, options);
  try {
    return await run(spinner);
  } finally {
    spinner.stop();
  }
}
