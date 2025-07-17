import ora from 'ora';
import type { CliSpinnerLib } from './t.ts';
/**
 * Tools for working with a CLI spinner.
 */
export const Spinner: CliSpinnerLib = {
  create(text = '', options = {}) {
    const { start = true, silent = false } = options;
    const spinner = ora(text);
    if (start && !silent) spinner.start();
    return spinner;
  },
};
