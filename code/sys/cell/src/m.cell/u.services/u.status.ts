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
    const status = captureStatus(handle.status());
    return status ?? statusReadError(
      new TypeError('service status() returned an invalid status snapshot'),
    );
  } catch (cause) {
    return statusReadError(cause);
  }
}

function statusReadError(cause: unknown): t.Service.Status {
  return { state: 'error', error: Err.std(cause) };
}

function captureStatus(value: unknown): t.Service.Status | undefined {
  if (!Is.record(value)) return undefined;
  const state = value.state;
  if (!isServiceState(state)) return undefined;
  const name = value.name;
  if (!isOptionalString(name)) return undefined;
  const kind = value.kind;
  if (!isOptionalString(kind)) return undefined;
  const root = value.root;
  if (!isOptionalString(root)) return undefined;
  const config = value.config;
  if (!isOptionalString(config)) return undefined;

  const published = value.urls;
  const urls = published === undefined ? undefined : captureUrls(published);
  if (published !== undefined && urls === undefined) return undefined;
  const details = value.details;
  if (!isOptionalArray(details, isServiceDetail)) return undefined;
  const error = value.error;
  if (error !== undefined && !Is.stdError(error)) return undefined;

  // Keep owner detail identities for presentation, but share only Cell-owned URL values.
  return { state, name, kind, root, config, urls, details, error };
}

/** Validate exactly the indexed facts retained, independent of owner array methods. */
function captureUrls(value: unknown): readonly t.Service.Url[] | undefined {
  if (!Is.array<unknown>(value)) return undefined;
  const urls: t.Service.Url[] = [];
  const length = value.length;
  for (let index = 0; index < length; index += 1) {
    const item = value[index];
    if (!Is.record(item)) return undefined;
    const href = item.href;
    if (!Is.str(href)) return undefined;
    const label = item.label;
    if (!isOptionalString(label)) return undefined;
    urls.push(label === undefined ? { href } : { href, label });
  }
  return urls;
}

function isServiceState(value: unknown): value is t.Service.State {
  return Is.str(value) && SERVICE_STATES.includes(value as t.Service.State);
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
