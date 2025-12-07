import { type t, c, Cli, D, Http, Process } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { startServing } from './cmd.serve.ts';

type Opts = { port?: number; silent?: boolean };

/**
 * Ensure the local server is running, then open the given sub-path in
 * the default browser.
 */
export async function ensureStartedThenOpen(
  cwd: t.StringDir,
  location: t.ServeTool.DirConfig,
  bundleDir: t.StringPath,
  opts: Opts = {},
) {
  const { silent = false, port = D.port } = opts;

  /** URLs */
  const baseUrl = `http://localhost:${port}`;
  const url = {
    dist: `${baseUrl}/dist.json`,
    bundleDir: `${baseUrl}/${bundleDir.replace(/^\/+/, '')}`,
  };

  /**
   * Fast probe: is the dist endpoint reachable within a small budget?
   * Spinner lives ONLY in this short prelude, never during the long-lived server.
   */
  let alreadyUp = false;

  if (silent) {
    // No spinner, just a straight probe.
    alreadyUp = await Http.Client.isAlive(url.dist, {
      timeout: 2_000,
      interval: 120,
      method: 'HEAD',
    });
  } else {
    const spinner = Cli.spinner(Fmt.spinnerText('Checking server...')).start();
    try {
      alreadyUp = await Http.Client.isAlive(url.dist, {
        timeout: 2_000,
        interval: 120,
        method: 'HEAD',
      });

      if (alreadyUp) {
        spinner.succeed(Fmt.spinnerText('Server ready'));
      } else {
        // Not an error: we’ll just start it in-process.
        spinner.stop();
      }
    } catch {
      spinner.stop();
      alreadyUp = false;
    }
  }

  /**
   * Server already running → print, open (detached), and exit.
   */
  if (alreadyUp) {
    if (!silent) console.info(c.cyan(url.bundleDir));

    // Fire-and-forget: do NOT block this process on the browser.
    void Process.invokeDetached({
      cmd: 'open',
      args: [url.bundleDir],
      cwd,
      silent: true,
    });

    return;
  }

  /**
   * Not already running — start the server and schedule a detached open.
   * No spinner here, so Ctrl+C behaviour is owned purely by the serve keyboard helper.
   */
  if (!silent) {
    console.info(Fmt.spinnerText('Starting server...'));
  }

  // Give the server a short head-start, then open in the browser.
  setTimeout(() => {
    void Process.invokeDetached({
      cmd: 'open',
      args: [url.bundleDir],
      cwd,
      silent: true,
    });
  }, 600);

  /**
   * Enter serve-mode (blocks until keyboard exit).
   */
  await startServing(cwd, location, { ...opts, port });
}
