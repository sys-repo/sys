import ora from 'ora';
import type { CliSpinnerLib } from './t.ts';

/**
 * Tools for working with a CLI spinner.
 */
export const Spinner: CliSpinnerLib = {
  create(text = '', options = {}) {
    const { start = true, silent = false } = options;

    const spinner = ora({
      text,
      // Important: do NOT let Ora grab stdin in the Node-compat layer.
      // This avoids the “first Ctrl+C cancels spinner, second exits” effect.
      discardStdin: false,
    });

    if (start && !silent) spinner.start();
    return spinner;
  },
};
