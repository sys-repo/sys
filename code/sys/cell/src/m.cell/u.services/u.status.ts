import { Err, Is, type t } from './common.ts';

export type StartedServiceStatus = {
  /** Effective selected Cell service facts remain authoritative in Cell output. */
  readonly service: t.Cell.Services.SelectedService;
  /** Selection audit trail back to the descriptor and requested mode. */
  readonly selection: t.Cell.Services.ServiceSelection;
  readonly paths: { readonly config: t.StringPath };
  readonly metrics: t.Cell.Services.ServiceMetrics;
  /** Optional renderer-neutral owner snapshot. */
  readonly owner?: t.Service.Status;
};

/**
 * Normalize all started services into Cell-owned service status view models.
 */
export function serviceStatusesOf(
  started: t.Cell.Services.Started,
): readonly StartedServiceStatus[] {
  return started.services.map(serviceStatusOf);
}

/**
 * Normalize one started service without probing owner-specific handle fields.
 */
export function serviceStatusOf(
  service: t.Cell.Services.StartedService,
): StartedServiceStatus {
  const owner = statusFromHandle(service.handle);
  return {
    service: service.service,
    selection: service.selection,
    paths: service.paths,
    metrics: service.metrics,
    ...(owner ? { owner } : {}),
  };
}

/**
 * Helpers:
 */
function statusFromHandle(handle: unknown): t.Service.Status | undefined {
  if (!Is.record(handle)) return undefined;
  if (!Is.func(handle.status)) return undefined;

  try {
    const status = handle.status();
    if (isServiceStatus(status)) return status;
    return statusReadError(new TypeError('service status() returned an invalid status snapshot'));
  } catch (cause) {
    return statusReadError(cause);
  }
}

function statusReadError(cause: unknown): t.Service.Status {
  return { state: 'error', error: Err.std(cause) };
}

function isServiceStatus(value: unknown): value is t.Service.Status {
  if (!Is.record(value)) return false;
  if (!isServiceState(value.state)) return false;
  if (!isOptionalString(value.name)) return false;
  if (!isOptionalString(value.kind)) return false;
  if (!isOptionalString(value.root)) return false;
  if (!isOptionalString(value.config)) return false;
  if (!isOptionalArray(value.urls, isServiceUrl)) return false;
  if (!isOptionalArray(value.details, isServiceDetail)) return false;
  if (value.error !== undefined && !Is.stdError(value.error)) return false;
  return true;
}

function isServiceState(value: unknown): value is t.Service.State {
  return Is.str(value) && SERVICE_STATES.includes(value as t.Service.State);
}

function isServiceUrl(value: unknown): value is t.Service.Url {
  return Is.record(value) && Is.str(value.href) && isOptionalString(value.label);
}

function isServiceDetail(value: unknown): value is t.Service.Detail {
  return Is.record(value) && Is.str(value.label) && Is.str(value.value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || Is.str(value);
}

function isOptionalArray<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is readonly T[] | undefined {
  return value === undefined || (Is.array<unknown>(value) && value.every(guard));
}

const SERVICE_STATES: readonly t.Service.State[] = [
  'starting',
  'ready',
  'stopping',
  'stopped',
  'error',
];
