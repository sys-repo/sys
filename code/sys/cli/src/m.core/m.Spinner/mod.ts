import ora from 'ora';
import type { t } from '../common.ts';

/**
 * Tools for working with a CLI spinner.
 */
export const Spinner: t.CliSpinner.Lib = {
  create(text = '') {
    return ora({
      text,
      // Important: do NOT let Ora grab stdin in the Node-compat layer.
      // This avoids the “first Ctrl+C cancels spinner, second exits” effect.
      discardStdin: false,
    });
  },

  start(text = '', options = {}) {
    const { silent = false } = options;
    const spinner = Spinner.create(text);
    if (!silent) spinner.start();
    return spinner;
  },

  async with<T>(text: string, run: (spinner: t.CliSpinner.Instance) => Promise<T>, options = {}) {
    const spinner = Spinner.start(text, options);
    try {
      return await run(spinner);
    } finally {
      spinner.stop();
    }
  },
};
