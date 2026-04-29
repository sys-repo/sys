import { Is, type t } from './common.ts';
import { verify } from './u.verify.ts';

export const start: t.Cell.Runtime.Lib['start'] = async (cell, options = {}) => {
  const verification = await verify(cell, options);
  const services: t.Cell.Runtime.StartedService[] = [];

  try {
    for (const service of verification.services) {
      const args = { cwd: cell.root, ...service.config };
      const startArgs = options.args ? await options.args({ cell, service, args }) : args;
      const started = await service.endpoint.start(startArgs);
      services.push({ ...service, started });
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
    await closeHandle(service.started, reason);
  }
}

async function closeHandle(handle: unknown, reason?: unknown) {
  if (!Is.record(handle)) return;
  if (Is.func(handle.close)) return await handle.close(reason);
  if (Is.func(handle.dispose)) return await handle.dispose(reason);
}
