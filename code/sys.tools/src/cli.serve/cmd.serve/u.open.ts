import { type t, Process } from '../common.ts';

/**
 * Helpers for opening URLs via the native OS handler.
 */
export const Open = {
  /**
   * Opens a URL in the default browser without attaching lifecycle
   * to the current process (fire-and-forget).
   */
  invokeDetached(cwd: t.StringDir, url: t.StringUrl, opts: { silent?: boolean } = {}) {
    const { silent = true } = opts;
    void Process.invokeDetached({ cmd: 'open', args: [url], cwd, silent });
  },
};
