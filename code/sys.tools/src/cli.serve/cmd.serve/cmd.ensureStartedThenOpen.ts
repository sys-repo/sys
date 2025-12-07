import { type t, c, D, Http, Process } from '../common.ts';
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
  const baseUrl = `http://localhost:${port}`;
  const url = {
    dist: `${baseUrl}/dist.json`,
    bundleDir: `${baseUrl}/${bundleDir.replace(/^\/+/, '')}`,
  };

  /** Fast probe: is the dist endpoint reachable within a small budget? */
  const alreadyUp = await Http.Client.isAlive(url.dist, {
    timeout: 2_000,
    interval: 120,
    method: 'HEAD',
  });

  if (alreadyUp) {
    // Print + open browser immediately.
    if (!silent) console.info(c.cyan(url.bundleDir));

    await Process.invoke({
      cmd: 'open',
      args: [url.bundleDir],
      cwd,
      silent: true,
    });
    return;
  }

  /** Not already running — start server and open once ready. */
  void (async () => {
    try {
      await Http.Client.waitFor(url.dist, {
        timeout: 5_000,
        interval: 120,
        method: 'HEAD',
      });

      if (!silent) console.info(c.cyan(url.bundleDir));

      await Process.invoke({
        cmd: 'open',
        args: [url.bundleDir],
        cwd,
        silent: true,
      });
    } catch {
      // Best-effort only; ignore readiness/open failure.
    }
  })();

  /** Block like a normal `serve` command. */
  await startServing(cwd, location, { ...opts, port });
}
