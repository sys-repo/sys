import { Is, Path, Str, type t } from './common.ts';
import { endpointNameOf } from '../u.endpoint.ts';
import { resolveEndpointRef } from '../u.endpointRef.ts';

export const verify: t.Cell.Services.Lib['verify'] = async (cell, options = {}) => {
  const services: t.Cell.Services.VerifiedService[] = [];

  for (const service of cell.descriptor.services ?? []) {
    const specifier = resolveEndpointRef({
      root: cell.root,
      from: service.from,
      name: service.name,
      kind: 'service',
      context: 'Cell.Services.verify',
      trusted: options.trusted,
    }).specifier;
    const configPath = resolveCellPath(cell.root, service.config);
    const endpoint = await loadEndpoint(service, specifier);

    services.push({
      service,
      paths: { config: configPath },
      endpoint,
    });
  }

  return { services };
};

/**
 * Helpers:
 */
async function loadEndpoint(
  service: t.Cell.Services.Service,
  specifier: string,
): Promise<t.Cell.Services.LifecycleEndpoint> {
  let mod: unknown;
  try {
    mod = await import(/* @vite-ignore */ specifier);
  } catch (cause) {
    const { name, from } = service;
    const err = `Cell.Services.verify: failed to import service for '${name}': ${from}`;
    throw new Error(err, { cause });
  }

  const endpointName = endpointNameOf(service);
  const endpoint = (mod as Record<string, unknown>)[endpointName];

  if (!Is.record(endpoint) || !Is.func(endpoint.start)) {
    const err =
      `Cell.Services.verify: '${service.from}' use '${endpointName}' must expose start(...) for service '${service.name}'.`;
    throw new Error(err);
  }

  return endpoint as t.Cell.Services.LifecycleEndpoint;
}

function resolveCellPath(root: t.StringDir, path: t.StringPath): t.StringPath {
  const rootAbs = Path.resolve(root, '.');
  const relative = Str.trimLeadingDotSlash(path);
  const resolved = Path.resolve(rootAbs, relative);

  if (!isInsideRoot(rootAbs, resolved)) {
    throw new Error(`Cell.Services.verify: config escapes Cell root: ${path}`);
  }

  return resolved;
}

function isInsideRoot(root: string, path: string) {
  const relative = Path.relative(root, path);
  return relative === '' || (!relative.startsWith('..') && !Path.Is.absolute(relative));
}

