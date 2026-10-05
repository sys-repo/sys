import { Is, Num, type t } from './common.ts';
import { planServices } from './u.plan.ts';
import { loadEndpoint } from './u.verify.ts';

export const resources: t.Cell.Services.Lib['resources'] = async (cell, options = {}) => {
  const plan = planServices(cell, options, 'Cell.Services.resources');
  const resources: t.Cell.Services.PlannedResource[] = [];

  for (const service of plan.services) {
    const endpoint = await loadEndpoint(service, 'Cell.Services.resources');
    if (!Is.func(endpoint.resources)) continue;

    const declared = await readResources(cell, service, endpoint);
    for (const resource of declared) {
      resources.push({
        service: service.service,
        selection: service.selection,
        paths: service.paths,
        endpoint: service.endpoint,
        resource,
      });
    }
  }

  return { root: plan.root, mode: plan.mode, resources };
};

/**
 * Helpers:
 */
async function readResources(
  cell: t.Cell.Instance,
  service: t.Cell.Services.PlannedService,
  endpoint: t.Cell.Services.LifecycleEndpoint,
): Promise<readonly t.Service.Resource.Any[]> {
  let declared: unknown;
  try {
    declared = await endpoint.resources?.(resourceArgs(cell, service));
  } catch (cause) {
    throw new Error(
      `Cell.Services.resources: failed to read resources for service '${service.service.name}'.`,
      { cause },
    );
  }

  if (declared === undefined) return [];
  if (!Is.array(declared)) {
    throw invalidResource(service.service.name, 'resources hook must return an array');
  }

  return declared.map((item, index) => resourceOf(service.service.name, item, index));
}

function resourceArgs(
  cell: t.Cell.Instance,
  service: t.Cell.Services.PlannedService,
): t.Cell.Services.ResourceArgs {
  return {
    cwd: cell.root,
    paths: { config: service.paths.config },
  };
}

function resourceOf(
  service: string,
  input: unknown,
  index: number,
): t.Service.Resource.Any {
  if (!Is.record(input)) throw invalidResource(service, `resource ${index} must be a record`);
  if (input.kind !== 'tcp-listener') {
    throw invalidResource(service, `resource ${index} has unsupported kind: ${String(input.kind)}`);
  }

  const port = portOf(service, input.port, index);
  const host = hostOf(service, input.host, index);

  return host ? { kind: 'tcp-listener', host, port } : { kind: 'tcp-listener', port };
}

function portOf(service: string, input: unknown, index: number): t.PortNumber {
  if (!Is.num(input) || !Num.Is.safeInt(input) || input < 1 || input > 65_535) {
    throw invalidResource(service, `resource ${index} has invalid tcp port: ${String(input)}`);
  }
  return input as t.PortNumber;
}

function hostOf(service: string, input: unknown, index: number): string | undefined {
  if (input === undefined) return undefined;
  if (!Is.str(input) || input.trim().length === 0) {
    throw invalidResource(service, `resource ${index} has invalid tcp host: ${String(input)}`);
  }
  return input.trim();
}

function invalidResource(service: string, message: string) {
  return new Error(
    `Cell.Services.resources: service '${service}' declared invalid resource: ${message}.`,
  );
}
