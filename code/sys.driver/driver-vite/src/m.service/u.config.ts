import { Fs, Is, Num, type t, Yaml } from './common.ts';

const CONTEXT = '@sys/driver-vite/service ViteService';
const CONFIG_FIELDS = ['name', 'dir', 'port'] as const;

/** Load and validate the YAML-authored Vite service owner config. */
export async function loadConfig(path: t.StringPath): Promise<t.ViteService.Config> {
  const read = await Fs.readText(path);
  if (!read.ok) {
    throw new Error(`${CONTEXT}: failed to read config: ${path}`, { cause: read.error });
  }

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    throw new Error(`${CONTEXT}: failed to parse config YAML: ${path}`, {
      cause: parsed.error,
    });
  }

  const data = parsed.data ?? {};
  if (!Is.record(data)) throw new Error(`${CONTEXT}: config must be a YAML record: ${path}`);

  return normalizeConfig(data, path);
}

/**
 * Helpers:
 */
function normalizeConfig(
  data: Record<string, unknown>,
  path: t.StringPath,
): t.ViteService.Config {
  rejectUnknownFields(data, path);

  const name = optionalString(data.name, 'name', path);
  const dir = optionalString(data.dir, 'dir', path);
  const port = optionalPort(data.port, path);

  return {
    ...(name ? { name } : {}),
    ...(dir ? { dir } : {}),
    ...(port !== undefined ? { port } : {}),
  };
}

function rejectUnknownFields(data: Record<string, unknown>, path: t.StringPath) {
  for (const key of Object.keys(data)) {
    if (!CONFIG_FIELDS.includes(key as typeof CONFIG_FIELDS[number])) {
      throw new Error(`${CONTEXT}: unknown config field '${key}' in ${path}`);
    }
  }
}

function optionalString(value: unknown, field: string, path: t.StringPath): string | undefined {
  if (value === undefined) return undefined;
  if (!Is.str(value) || Is.blank(value)) {
    throw new Error(`${CONTEXT}: config field '${field}' must be a non-empty string in ${path}`);
  }
  return value.trim();
}

function optionalPort(value: unknown, path: t.StringPath): number | undefined {
  if (value === undefined) return undefined;
  if (!Is.num(value) || !Num.Is.int(value) || value < 1 || value > 65_535) {
    throw new Error(`${CONTEXT}: config field 'port' must be an integer from 1 to 65535 in ${path}`);
  }
  return value;
}
