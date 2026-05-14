import { Is, type t, Time } from './common.ts';
import { verify } from './u.verify.ts';

export const start: t.Cell.Services.Lib['start'] = async (cell, options = {}) => {
  const verification = await verify(cell, options);
  const services: t.Cell.Services.StartedService[] = [];

  try {
    for (const service of verification.services) {
      const args = startArgsOf(cell, service, options);
      const startedAt = Time.now.timestamp;
      const handle = await service.endpoint.start(args);
      const resolvedAt = Time.now.timestamp;
      const metrics: t.Cell.Services.ServiceMetrics = { start: { startedAt, resolvedAt } };
      services.push({ ...service, handle, metrics });
    }
  } catch (cause) {
    const name = verification.services[services.length]?.service.name ?? '<unknown>';
    let finalCause = cause;
    try {
      await closeStarted(services, 'start-failed');
    } catch (closeCause) {
      finalCause = new AggregateError(
        [cause, closeCause],
        `Cell.Services.start: service '${name}' failed and cleanup also failed.`,
      );
    }
    throw new Error(`Cell.Services.start: failed to start service '${name}'.`, {
      cause: finalCause,
    });
  }

  return {
    services,
    close: (reason) => closeStarted(services, reason),
  };
};

/**
 * Helpers:
 */
function startArgsOf(
  cell: t.Cell.Instance,
  service: t.Cell.Services.VerifiedService,
  options: t.Cell.Services.StartOptions,
): t.Cell.Services.StartArgs {
  const args: t.Cell.Services.StartArgs = {
    cwd: cell.root,
    paths: { config: service.paths.config },
  };
  if (options.until) return { ...args, until: options.until };
  return args;
}

async function closeStarted(
  services: readonly t.Cell.Services.StartedService[],
  reason?: unknown,
): Promise<void> {
  const errors: unknown[] = [];

  for (const service of [...services].reverse()) {
    try {
      await closeHandle(service.handle, reason);
    } catch (cause) {
      errors.push(cause);
    }
  }

  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Cell.Services.close: failed to close services.');
  }
}

async function closeHandle(handle: unknown, reason?: unknown) {
  if (!Is.record(handle)) return;
  if (Is.func(handle.close)) return await handle.close(reason);
  if (Is.func(handle.dispose)) return await handle.dispose(reason);
}
