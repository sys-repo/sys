import ora from 'ora';
import type { t } from '../common.ts';

/**
 * Tools for working with a CLI spinner.
 */
export const Spinner: t.CliSpinnerLib = {
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
