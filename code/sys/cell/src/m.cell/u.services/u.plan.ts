import { Is, Path, Str, type t } from './common.ts';
import { IdPattern } from '../u.schema/common.ts';
import { endpointNameOf, resolveEndpointRef } from '../u/endpoints.ts';

export const plan: t.Cell.Services.Lib['plan'] = async (cell, options = {}) => {
  return planServices(cell, options, 'Cell.Services.plan');
};

export function planServices(
  cell: t.Cell.Instance,
  options: t.Cell.Services.PlanOptions = {},
  context: string,
): t.Cell.Services.Plan {
  const mode = serviceModeOf((options as { readonly mode?: unknown }).mode, context);
  const services = cell.descriptor.services ?? [];

  if (mode !== 'default' && !services.some((service) => service.variants?.[mode])) {
    throw new Error(`${context}: unknown service mode '${mode}'.`);
  }

  const planned = services.map((service) => {
    const selected = selectServiceBinding(service, mode);
    return planService(cell, service, selected, mode, options, context);
  });

  return {
    root: cell.root,
    mode,
    services: planned,
  };
}

/**
 * Helpers:
 */
type SelectedBinding = {
  readonly binding: t.Cell.Services.ServiceBinding;
  readonly variant?: t.Cell.Id;
};

const ServiceModePattern = new RegExp(IdPattern);

export function isServiceMode(value: string): value is t.Cell.Services.ServiceMode {
  return value === 'default' || ServiceModePattern.test(value);
}

function serviceModeOf(value: unknown, context: string): t.Cell.Services.ServiceMode {
  if (value === undefined) return 'default';
  if (!Is.str(value) || !isServiceMode(value)) {
    throw new Error(`${context}: invalid service mode '${String(value)}'.`);
  }
  return value;
}

function selectServiceBinding(
  service: t.Cell.Services.Service,
  mode: t.Cell.Services.ServiceMode,
): SelectedBinding {
  if (mode !== 'default') {
    const variant = service.variants?.[mode];
    if (variant) return { binding: variant, variant: mode as t.Cell.Id };
  }

  return { binding: bindingOf(service) };
}

function bindingOf(service: t.Cell.Services.Service): t.Cell.Services.ServiceBinding {
  return {
    use: service.use,
    from: service.from,
    config: service.config,
    ...(service.timeout === undefined ? {} : { timeout: service.timeout }),
  };
}

function planService(
  cell: t.Cell.Instance,
  descriptor: t.Cell.Services.Service,
  selected: SelectedBinding,
  mode: t.Cell.Services.ServiceMode,
  options: t.Cell.Services.TrustOptions,
  context: string,
): t.Cell.Services.PlannedService {
  const { binding } = selected;
  const service: t.Cell.Services.SelectedService = {
    name: descriptor.name,
    ...binding,
  };
  const endpoint = resolveServiceEndpointAddress(cell, service, options, context);
  const configPath = resolveServiceConfigPath(cell.root, binding.config, context);
  const selection: t.Cell.Services.ServiceSelection = {
    name: descriptor.name,
    mode,
    ...(selected.variant ? { variant: selected.variant } : {}),
    descriptor,
    binding,
  };

  return {
    service,
    selection,
    paths: { config: configPath },
    endpoint,
  };
}

function resolveServiceEndpointAddress(
  cell: t.Cell.Instance,
  service: t.Cell.Services.SelectedService,
  options: t.Cell.Services.TrustOptions,
  context: string,
): t.Cell.Services.PlannedEndpoint {
  const use = endpointNameOf(service);
  const ref = resolveEndpointRef({
    root: cell.root,
    from: service.from,
    name: service.name,
    kind: 'service',
    context,
    trusted: options.trusted,
  });

  return {
    use,
    from: service.from,
    specifier: ref.specifier,
    source: ref.source,
  };
}

function resolveServiceConfigPath(
  root: t.StringDir,
  path: t.Cell.Path,
  context: string,
): t.StringPath {
  const rootAbs = Path.resolve(root, '.');
  const relative = Str.trimLeadingDotSlash(path);
  const resolved = Path.resolve(rootAbs, relative);

  if (!Path.Is.within(rootAbs, resolved)) {
    throw new Error(`${context}: config escapes Cell root: ${path}`);
  }

  return resolved;
}
