import { Is, Str, type t, Yaml } from './common.ts';
import { Fs } from '@sys/fs';

const DEFAULT_TRUSTED = ['@sys/'] as const;

export const check: t.Cell.Runtime.Lib['check'] = async (cell, options = {}) => {
  const services: t.Cell.Runtime.CheckedService[] = [];

  for (const service of cell.descriptor.runtime?.services ?? []) {
    assertTrusted(service, options);

    const configPath = resolveCellPath(cell.root, service.config);
    const config = await loadConfig(service, configPath);
    const endpoint = await loadEndpoint(service);

    services.push({
      service,
      paths: { config: configPath },
      config,
      endpoint,
    });
  }

  return { services };
};

function assertTrusted(service: t.Cell.Runtime.Service, options: t.Cell.Runtime.CheckOptions) {
  const trusted = options.trusted ?? DEFAULT_TRUSTED;
  const ok = trusted.some((prefix) => service.from.startsWith(prefix));
  if (!ok) {
    const { name, from } = service;
    const err = `Cell.Runtime.check: untrusted runtime service import for '${name}': ${from}`;
    throw new Error(err);
  }
}

async function loadConfig(
  service: t.Cell.Runtime.Service,
  path: t.StringPath,
): Promise<Record<string, unknown>> {
  const read = await Fs.readText(path);
  if (!read.ok) {
    throw new Error(`Cell.Runtime.check: failed to read config for '${service.name}': ${path}`);
  }

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    const err = `Cell.Runtime.check: failed to parse config YAML for '${service.name}': ${path}`;
    throw new Error(err, { cause: parsed.error });
  }

  if (!Is.record(parsed.data)) {
    const err = `Cell.Runtime.check: config for '${service.name}' must be a YAML object: ${path}`;
    throw new Error(err);
  }

  return parsed.data;
}

async function loadEndpoint(
  service: t.Cell.Runtime.Service,
): Promise<t.Cell.Runtime.LifecycleEndpoint> {
  let mod: unknown;
  try {
    mod = await import(/* @vite-ignore */ service.from);
  } catch (cause) {
    const { name, from } = service;
    const err = `Cell.Runtime.check: failed to import runtime service for '${name}': ${from}`;
    throw new Error(err, { cause });
  }

  const endpoint = (mod as Record<string, unknown>)[service.export];

  if (!Is.record(endpoint) || !Is.func(endpoint.start)) {
    const err =
      `Cell.Runtime.check: '${service.from}' export '${service.export}' must expose start(...) for service '${service.name}'.`;
    throw new Error(err);
  }

  return endpoint as t.Cell.Runtime.LifecycleEndpoint;
}

function resolveCellPath(root: t.StringDir, path: t.StringPath): t.StringPath {
  const relative = Str.trimLeadingDotSlash(path);
  return Fs.join(root, relative);
}
