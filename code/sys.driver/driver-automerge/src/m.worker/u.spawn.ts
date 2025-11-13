import { type t, Schedule } from './common.ts';
import { createRepo } from './u.createRepo.ts';
import { Wire } from './u.evt.wire.ts';

/**
 * Spawn a Web Worker and return { worker, repoFacade }.
 * Client-side helper: creates MessageChannel, posts port2 to worker, binds facade to port1.
 */
export const spawn: t.CrdtWorkerLib['spawn'] = async (url, opts = {}) => {
  const { until } = opts;
  const worker = new Worker(url, opts.worker ?? { type: 'module' });

  const { port1, port2 } = new MessageChannel();
  const repo = createRepo(port1, { until });

  // Important: include the port in data, not just in the transfer list.
  worker.postMessage({ kind: Wire.Stream.attach, port: port2 }, [port2]);

  await Schedule.micro(); // ← Allow wire events to flush before returning.
  return {
    worker,
    repo,
  };
};
