import { Time, type t } from './common.ts';

/**
 * Kills a child process.
 */
export async function kill(
  child: Deno.ChildProcess,
  options: { log?: boolean; timeout?: t.Msecs } = {},
) {
  const { log = false, timeout = 5_000 } = options;

  let timer: t.TimeDelayPromise | undefined;
  let killed = false;

  const forceKill = async () => {
    if (killed) return;
    killed = true;
    try {
      Deno.kill(child.pid, 'SIGKILL');
      await child.status;
      if (log) console.info(`Sent SIGKILL to process ${child.pid}.`);
    } catch (error) {
      if (log) console.error(`Failed to kill (SIGKILL) process ${child.pid}:`, error);
    }
  };

  try {
    Deno.kill(child.pid, 'SIGTERM'); // Send signal to terminate the process.
    if (log) console.info(`Sent SIGTERM to process ${child.pid}.`);

    // Start timer to escalate to SIGKILL after the timeout.
    timer = Time.delay(timeout, forceKill);
    const status = await child.status;

    // If the process exits successfully dispose the timer.
    if (log) console.info(`Process ${child.pid} exited with status ${status.code}.`);
    if (timer) timer.cancel();
  } catch (error) {
    if (log) console.error(`Failed to terminate (SIGTERM) process ${child.pid}:`, error);
    await forceKill();
  } finally {
    if (timer) timer.cancel();
  }
}
