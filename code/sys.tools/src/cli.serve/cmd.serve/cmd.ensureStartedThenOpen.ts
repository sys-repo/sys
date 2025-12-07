import { type t, c, Cli, D, Http, Process } from '../common.ts';
import { startServing } from './cmd.serve.ts';
import { Fmt } from '../u.fmt.ts';

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
  const baseUrl = `http://localhost:${port}`;
  const url = {
    dist: `${baseUrl}/dist.json`,
    bundleDir: `${baseUrl}/${bundleDir.replace(/^\/+/, '')}`,
  };

  /** Fast probe: is the dist endpoint reachable within a small budget? */
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
        spinner.stop(); // not an error, we’ll just start it.
      }
    } catch {
      spinner.stop();
      alreadyUp = false;
    }
  }

  if (alreadyUp) {
    // Server is already running: print + open, then exit.
    if (!silent) console.info(c.cyan(url.bundleDir));

    await Process.invoke({
      cmd: 'open',
      args: [url.bundleDir],
      cwd,
      silent: true,
    });
    return;
  }

  /** Not already running — just start the server like normal. */
  await startServing(cwd, location, { ...opts, port });
}
