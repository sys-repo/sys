import { Is, type t, Time } from './common.ts';
import { verify } from './u.verify.ts';

export const start: t.Cell.Runtime.Lib['start'] = async (cell, options = {}) => {
  const verification = await verify(cell, options);
  const services: t.Cell.Runtime.StartedService[] = [];

  try {
    for (const service of verification.services) {
      const base: t.Cell.Runtime.StartArgs = { cwd: cell.root, ...service.config };
      const args = options.startArgs ? await options.startArgs({ cell, service, base }) : base;
      const startedAt = Time.now.timestamp;
      const handle = await service.endpoint.start(args);
      const resolvedAt = Time.now.timestamp;
      const metrics: t.Cell.Runtime.ServiceMetrics = { start: { startedAt, resolvedAt } };
      services.push({ ...service, handle, metrics });
    }
  } catch (cause) {
    await closeStarted(services, 'start-failed');
    const name = verification.services[services.length]?.service.name ?? '<unknown>';
    throw new Error(`Cell.Runtime.start: failed to start service '${name}'.`, { cause });
  }

  return {
    services,
    close: (reason) => closeStarted(services, reason),
  };
};

async function closeStarted(
  services: readonly t.Cell.Runtime.StartedService[],
  reason?: unknown,
): Promise<void> {
  for (const service of [...services].reverse()) {
    await closeHandle(service.handle, reason);
  }
}

async function closeHandle(handle: unknown, reason?: unknown) {
  if (!Is.record(handle)) return;
  if (Is.func(handle.close)) return await handle.close(reason);
  if (Is.func(handle.dispose)) return await handle.dispose(reason);
}
