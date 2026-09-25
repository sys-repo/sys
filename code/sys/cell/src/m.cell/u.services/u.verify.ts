import { Is, type t } from './common.ts';
import { planServices } from './u.plan.ts';

export const verify: t.Cell.Services.Lib['verify'] = async (cell, options = {}) => {
  const plan = planServices(cell, options, 'Cell.Services.verify');
  const services: t.Cell.Services.VerifiedService[] = [];

  for (const service of plan.services) {
    const endpoint = await loadEndpoint(service, 'Cell.Services.verify');

    services.push({
      service: service.service,
      selection: service.selection,
      paths: service.paths,
      endpoint,
    });
  }

  return { services };
};

/**
 * Helpers:
 */
export async function loadEndpoint(
  service: t.Cell.Services.PlannedService,
  context: string,
): Promise<t.Cell.Services.LifecycleEndpoint> {
  let mod: unknown;
  try {
    mod = await import(/* @vite-ignore */ service.endpoint.specifier);
  } catch (cause) {
    const { name, from } = service.service;
    const err = `${context}: failed to import service for '${name}': ${from}`;
    throw new Error(err, { cause });
  }

  const endpointName = service.endpoint.use;
  const endpoint = (mod as Record<string, unknown>)[endpointName];

  if (!Is.record(endpoint) || !Is.func(endpoint.start)) {
    const err =
      `${context}: '${service.service.from}' use '${endpointName}' must expose start(...) for service '${service.service.name}'.`;
    throw new Error(err);
  }

  return endpoint as t.Cell.Services.LifecycleEndpoint;
}

