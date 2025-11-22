import { type t, Rx, Schedule } from './common.ts';
import { CrdtWorkerCmd } from './m.Cmd.ts';
import { createRepo } from './u.client.proxy.repo.ts';
import { Wire } from './u.wire.ts';

/**
 * Spawn a Web Worker and return { worker, repoFacade }.
 * Client-side helper: creates MessageChannel, posts port2 to worker, binds facade to port1.
 */
export const spawn: t.CrdtWorkerClientLib['spawn'] = async (input, opts = {}) => {
  const { until, config } = opts;
  const worker =
    input instanceof Worker ? input : new Worker(input, opts.worker ?? { type: 'module' });

  const { port1, port2 } = new MessageChannel();
  const repo = createRepo(port1, { until });

  /**
   * Wait for the worker to signal that its `listen()` handler
   * is installed and it is ready to accept the `crdt:attach` port.
   */
  await new Promise<void>((resolve) => {
    const { signal, dispose } = Rx.abortable();
    const onReady = (ev: MessageEvent) => {
      const data = ev.data as { kind?: string } | undefined;
      if (data?.kind === Wire.Kind.workerReady) {
        dispose();
        resolve();
      }
    };
    worker.addEventListener('message', onReady, { signal });
  });

  /**
   * Important: include the port in data, not just in the transfer list.
   */
  const kind = Wire.Kind.attach;
  worker.postMessage({ kind, port: port2, config }, [port2]);

  /**
   * Worker-level command handshake:
   * - Use the typed Cmd client over `port1` to invoke `attach`, which in turn
   *   binds the real repo instance on the worker side via `attachRepo(...)`.
   */
  const cmd = CrdtWorkerCmd.make();
  const client = cmd.client(port1);
  await client.send('attach', { config });

  // Finish up.
  await Schedule.micro(); // ← Allow wire events to flush before returning.
  return {
    worker,
    repo,
  };
};
