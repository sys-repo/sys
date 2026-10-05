import { D, Is, Num, type t, Time } from './common.ts';
import { loadEndpoint } from './u.verify.ts';

export type ServiceState = {
  readonly planned: t.Cell.Services.PlannedService;
  readonly life: t.Abortable;
  active?: t.Cell.Services.StartedService;
  closed: boolean;
};

type ServiceStartFailure = Error & {
  readonly kind: 'CellServiceStartFailure';
  readonly service: string;
  readonly cause: unknown;
};

export async function activateService(
  cell: t.Cell.Instance,
  state: ServiceState,
  options: t.Cell.Services.StartOptions,
): Promise<t.Cell.Services.StartedService> {
  const { life, planned } = state;
  let accepted = false;
  let timer: t.Time.Delay.Promise | undefined;

  try {
    const timeout = timeoutOf(planned.service, options);
    const timeoutCause = serviceStartupTimeout(planned.service.name, timeout);
    timer = Time.delay(timeout, () => life.dispose(timeoutCause));

    const operation = startPlannedService(cell, planned, life.signal);
    operation.then(
      (service) => {
        if (!accepted && life.signal.aborted) {
          void closeHandle(service.handle, life.signal.reason).catch(() => undefined);
        }
      },
      () => undefined,
    );

    const service = await raceAbort(operation, life.signal);
    if (life.signal.aborted) throw abortReason(life.signal);
    accepted = true;
    return service;
  } catch (cause) {
    throw serviceStartFailure(planned.service.name, cause);
  } finally {
    timer?.cancel();
  }
}

export async function closeHandle(handle: unknown, reason?: unknown) {
  if (!Is.record(handle)) return;
  if (Is.func(handle.close)) return await handle.close(reason);
  if (Is.func(handle.dispose)) return await handle.dispose(reason);
}

export function serviceFailureOf(cause: unknown): { name: string; cause: unknown } {
  if (isServiceStartFailure(cause)) return { name: cause.service, cause: cause.cause };
  return { name: '<unknown>', cause };
}

/**
 * Helpers:
 */
async function startPlannedService(
  cell: t.Cell.Instance,
  service: t.Cell.Services.PlannedService,
  signal: AbortSignal,
): Promise<t.Cell.Services.StartedService> {
  throwIfAborted(signal);
  const endpoint = await loadEndpoint(service, 'Cell.Services.start');
  throwIfAborted(signal);

  const verified: t.Cell.Services.VerifiedService = {
    service: service.service,
    selection: service.selection,
    paths: service.paths,
    endpoint,
  };
  const args = startArgsOf(cell, verified, signal);
  const startedAt = Time.now.timestamp;
  const handle = await verified.endpoint.start(args);
  const resolvedAt = Time.now.timestamp;
  if (signal.aborted) {
    await closeHandle(handle, abortReason(signal));
    throw abortReason(signal);
  }

  const metrics: t.Cell.Services.ServiceMetrics = { start: { startedAt, resolvedAt } };
  return { ...verified, handle, metrics };
}

function startArgsOf(
  cell: t.Cell.Instance,
  service: t.Cell.Services.VerifiedService,
  signal: AbortSignal,
): t.Cell.Services.StartArgs {
  return {
    cwd: cell.root,
    paths: { config: service.paths.config },
    silent: true,
    until: signal,
  };
}

function timeoutOf(
  service: t.Cell.Services.SelectedService,
  options: t.Cell.Services.StartOptions,
): t.Msecs {
  const timeout = options.timeout ?? service.timeout ?? D.services.start.timeout;
  if (!Num.Is.safeInt(timeout) || timeout < 1) {
    throw new Error(`Cell.Services.start: invalid timeout: ${String(timeout)}.`);
  }
  return timeout;
}

async function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw abortReason(signal);

  return await new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };
    const onAbort = () => settle(() => reject(abortReason(signal)));

    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => settle(() => resolve(value)),
      (cause) => settle(() => reject(cause)),
    );
  });
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw abortReason(signal);
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new Error('Cell.Services.start: startup aborted.');
}

function serviceStartFailure(service: string, cause: unknown): ServiceStartFailure {
  const error = new Error(
    `Cell service '${service}' startup failed.`,
    { cause },
  ) as ServiceStartFailure;
  Object.assign(error, { kind: 'CellServiceStartFailure', service });
  return error;
}

function isServiceStartFailure(input: unknown): input is ServiceStartFailure {
  return Is.record(input) && input.kind === 'CellServiceStartFailure' && Is.str(input.service);
}

function serviceStartupTimeout(service: string, timeout: t.Msecs): Error {
  return new Error(
    `Cell.Services.start: service '${service}' startup timed out after ${Time.duration(timeout)}.`,
  );
}
