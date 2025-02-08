import ora from 'ora';
import type { t } from './common.ts';

/**
 * Tools for working with a CLI spinner.
 */
export const Spinner: t.CliSpinnerLib = {
  create(text = '', options = {}) {
    const { start = true, silent = false } = options;
    const spinner = ora(text);
    if (start && !silent) spinner.start();
    return spinner;
  },
};
