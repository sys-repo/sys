import { type t, Schedule } from './common.ts';
import { createRepo } from './u.createRepo.ts';
import { Wire } from './u.evt.wire.ts';

/**
 * Spawn a Web Worker and return { worker, repoFacade }.
 * Client-side helper: creates MessageChannel, posts port2 to worker, binds facade to port1.
 */
export const spawn: t.CrdtWorkerLib['spawn'] = async (url, opts = {}) => {
  const { until } = opts;

  // Create worker (Deno-safe: pass through workerOpts as provided by caller).
  const worker = new Worker(url, opts.worker ?? { type: 'module' });

  // Wire up a MessageChannel and send one end to the worker.
  const { port1, port2 } = new MessageChannel();
  worker.postMessage({ kind: Wire.Stream.attach }, [port2]);

  // Build the client-side façade on port1.
  const repo = createRepo(port1, { until });

  await Schedule.micro(); // Allow wire events to flush before returing.
  return { worker, repo };
};
