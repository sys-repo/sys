import { D, Fs, Is, type t, Yaml, YamlConfig } from './common.ts';
import { StaticConfigPath } from './u.config.path.ts';

const ERROR_PREFIX = 'HttpStatic config add';

export function resolveConfig(input: t.HttpStatic.ConfigAddInput) {
  const ref = resolveConfigRef(input.config);
  const name = resolveName(input.name, ref);
  return {
    path: ref.path,
    doc: {
      name,
      dir: textOrDefault(input.dir, '--dir', D.dir),
      hostname: textOrDefault(input.hostname, '--hostname', D.hostname),
      port: parsePort(input.port),
    } satisfies t.HttpStatic.ConfigDoc,
  };
}

export const resolveConfigRef = (input: unknown) =>
  YamlConfig.Ref.resolve({
    value: input,
    dir: StaticConfigPath.dir as t.StringDir,
    label: '--config',
    errorPrefix: ERROR_PREFIX,
    expandTilde: true,
  });

export async function loadConfig(
  path: t.StringPath,
  errorPrefix = ERROR_PREFIX,
): Promise<t.HttpStatic.ConfigDoc> {
  const read = await Fs.readText(path);
  if (!read.ok) {
    throw new Error(`${errorPrefix}: failed to read config: ${Fs.trimCwd(path)}`);
  }
  return parseConfigText(read.data ?? '', path, errorPrefix);
}

export function stringifyConfig(doc: t.HttpStatic.ConfigDoc): string {
  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) {
    throw new Error(`${ERROR_PREFIX}: failed to stringify config.`);
  }
  return yaml.data;
}

export function validateConfigText(text: string, path: t.StringPath): void {
  parseConfigText(text, path, ERROR_PREFIX);
}

export function sameConfig(a: t.HttpStatic.ConfigDoc, b: t.HttpStatic.ConfigDoc): boolean {
  return a.name === b.name &&
    a.dir === b.dir &&
    a.hostname === b.hostname &&
    a.port === b.port &&
    a.silent === b.silent;
}

function resolveName(input: unknown, ref: ReturnType<typeof resolveConfigRef>): string {
  if (input === undefined || input === null) return ref.name;
  const text = String(input).trim();
  if (!text) throw new Error(`${ERROR_PREFIX}: --name must not be empty.`);
  return text;
}

function requireText(input: unknown, flag: string): string {
  const text = String(input ?? '').trim();
  if (!text) throw new Error(`${ERROR_PREFIX}: missing required flag: ${flag}`);
  return text;
}

function textOrDefault(input: unknown, flag: string, fallback: string): string {
  if (input === undefined || input === null) return fallback;
  return requireText(input, flag);
}

function parsePort(input: unknown): number {
  if (input === undefined || input === null) return D.port;
  const text = requireText(input, '--port');
  const port = Number(text);
  if (!Is.num(port) || !Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`${ERROR_PREFIX}: --port must be an integer between 0 and 65535.`);
  }
  return port;
}

function parseConfigText(
  text: string,
  path: t.StringPath,
  errorPrefix: string,
): t.HttpStatic.ConfigDoc {
  const parsed = Yaml.parse<unknown>(text);
  if (parsed.error) {
    throw new Error(`${errorPrefix}: invalid config YAML: ${Fs.trimCwd(path)}`, {
      cause: parsed.error,
    });
  }

  const data = parsed.data;
  if (!Is.record(data)) {
    throw new Error(`${errorPrefix}: config must be a YAML object: ${Fs.trimCwd(path)}`);
  }

  assertKnownKeys(data, path, errorPrefix);
  return {
    name: readNonEmptyString(data, 'name', path, errorPrefix),
    dir: readNonEmptyString(data, 'dir', path, errorPrefix),
    hostname: readNonEmptyString(data, 'hostname', path, errorPrefix),
    port: readPort(data.port, path, errorPrefix),
    silent: readOptionalBoolean(data.silent, 'silent', path, errorPrefix),
  };
}

function assertKnownKeys(
  doc: Record<string, unknown>,
  path: t.StringPath,
  errorPrefix: string,
): void {
  const allowed = ['name', 'dir', 'hostname', 'port', 'silent'];
  const unknown = Object.keys(doc).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${errorPrefix}: unknown config key '${unknown[0]}': ${Fs.trimCwd(path)}`);
  }
}

function readNonEmptyString(
  doc: Record<string, unknown>,
  key: keyof t.HttpStatic.ConfigDoc,
  path: t.StringPath,
  errorPrefix: string,
): string {
  const value = doc[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `${errorPrefix}: config key '${key}' must be a non-empty string: ${Fs.trimCwd(path)}`,
    );
  }
  return value.trim();
}

function readPort(value: unknown, path: t.StringPath, errorPrefix: string): number {
  if (!Is.num(value) || !Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error(
      `${errorPrefix}: config key 'port' must be an integer between 0 and 65535: ${
        Fs.trimCwd(path)
      }`,
    );
  }
  return value;
}

function readOptionalBoolean(
  value: unknown,
  key: keyof Pick<t.HttpStatic.ConfigDoc, 'silent'>,
  path: t.StringPath,
  errorPrefix: string,
): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    throw new Error(`${errorPrefix}: config key '${key}' must be a boolean: ${Fs.trimCwd(path)}`);
  }
  return value;
}
