import { Is, Path, Str, type t } from './common.ts';
import { endpointNameOf } from '../u.endpoint.ts';
import { Fs } from '@sys/fs';

const DEFAULT_TRUSTED = ['@sys/'] as const;

export const verify: t.Cell.Services.Lib['verify'] = async (cell, options = {}) => {
  const services: t.Cell.Services.VerifiedService[] = [];

  for (const service of cell.descriptor.services ?? []) {
    const specifier = resolveImportSpecifier(cell, service, options);
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

function resolveImportSpecifier(
  cell: t.Cell.Instance,
  service: t.Cell.Services.Service,
  options: t.Cell.Services.VerifyOptions,
): string {
  const from = service.from.trim();

  if (Path.Is.absolute(from)) {
    throw new Error(
      `Cell.Services.verify: absolute service import for '${service.name}' is not allowed: ${from}`,
    );
  }

  if (isRelativeSpecifier(from)) return resolveLocalImportSpecifier(cell, service, from);

  const trusted = options.trusted ?? DEFAULT_TRUSTED;
  const ok = trusted.some((prefix) => from.startsWith(prefix));
  if (!ok) {
    const err = `Cell.Services.verify: untrusted service import for '${service.name}': ${from}`;
    throw new Error(err);
  }

  return from;
}

function resolveLocalImportSpecifier(
  cell: t.Cell.Instance,
  service: t.Cell.Services.Service,
  from: string,
): string {
  const root = Path.resolve(cell.root, '.');
  const path = Path.resolve(root, from) as t.StringPath;

  if (!isInsideRoot(root, path)) {
    throw new Error(
      `Cell.Services.verify: local service import for '${service.name}' escapes Cell root: ${from}`,
    );
  }

  return String(Fs.Path.toFileUrl(path));
}

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
  const resolved = Path.resolve(rootAbs, relative) as t.StringPath;

  if (!isInsideRoot(rootAbs, resolved)) {
    throw new Error(`Cell.Services.verify: config escapes Cell root: ${path}`);
  }

  return resolved;
}

function isInsideRoot(root: string, path: string) {
  const relative = Path.relative(root, path);
  return relative === '' || (!relative.startsWith('..') && !Path.Is.absolute(relative));
}

function isRelativeSpecifier(value: string) {
  return value.startsWith('./') || value.startsWith('../');
}
