import ora from 'ora';
import type { t } from './common.ts';

/**
 * Tools for working with a CLI spinner.
 */
export const Spinner: t.CliSpinnerLib = {
  create(text = '') {
    return ora(text).start();
  },
};
