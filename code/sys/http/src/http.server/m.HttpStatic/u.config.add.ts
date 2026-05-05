import { Is, type t } from './common.ts';
import { Fs } from '@sys/fs';
import { Yaml } from '@sys/yaml';
import { YamlConfig } from '@sys/yaml/cli';
import { StaticConfigPath } from './u.config.path.ts';

type ConfigAddChange = {
  readonly kind: 'added' | 'updated' | 'exists';
  readonly config: t.HttpStatic.ConfigDoc;
};

const STATIC_CONFIG_DIR = StaticConfigPath.dir;
const DEFAULT_DIR = '.';
const DEFAULT_HOSTNAME = '127.0.0.1';
const DEFAULT_PORT = 4040;

/** Create or update a static-server config YAML document. */
export async function add(
  input: t.HttpStatic.ConfigAddInput,
): Promise<t.HttpStatic.ConfigAddResult> {
  const resolved = resolveConfig(input);
  const desired = resolved.doc;
  const edit = await YamlConfig.Edit.update<t.HttpStatic.ConfigDoc, ConfigAddChange>({
    cwd: input.cwd,
    config: resolved.path,
    dryRun: input.dryRun,
    initial: () => desired,
    load: loadConfig,
    mutate: (doc, context) => {
      const same = sameConfig(doc, desired);
      const kind = context.created ? 'added' : same ? 'exists' : 'updated';
      return {
        doc: desired,
        changed: kind !== 'exists',
        change: { kind, config: desired },
      };
    },
    stringify: stringifyConfig,
    validateText: validateConfigText,
  });

  return {
    kind: edit.kind === 'dry-run' ? 'dry-run' : edit.change.kind,
    yamlPath: edit.path,
    created: edit.created,
    config: edit.change.config,
  };
}

/**
 * Helpers:
 */
async function loadConfig(path: t.StringPath): Promise<t.HttpStatic.ConfigDoc> {
  const read = await Fs.readText(path);
  if (!read.ok) {
    throw new Error(`HttpStatic config add: failed to read config: ${Fs.trimCwd(path)}`);
  }
  return parseConfigText(read.data ?? '', path);
}

function resolveConfig(input: t.HttpStatic.ConfigAddInput) {
  const ref = resolveConfigRef(input.config);
  const name = resolveName(input.name, ref);
  return {
    path: ref.path,
    doc: {
      name,
      dir: textOrDefault(input.dir, '--dir', DEFAULT_DIR),
      hostname: textOrDefault(input.hostname, '--hostname', DEFAULT_HOSTNAME),
      port: parsePort(input.port),
    },
  };
}

export const resolveConfigRef = (input: unknown) =>
  YamlConfig.Ref.resolve({
    value: input,
    dir: STATIC_CONFIG_DIR as t.StringDir,
    label: '--config',
    errorPrefix: 'HttpStatic config add',
    expandTilde: true,
  });

function resolveName(input: unknown, ref: ReturnType<typeof resolveConfigRef>): string {
  if (input === undefined || input === null) return ref.name;
  const text = String(input).trim();
  if (!text) throw new Error('HttpStatic config add: --name must not be empty.');
  return text;
}

function requireText(input: unknown, flag: string): string {
  const text = String(input ?? '').trim();
  if (!text) throw new Error(`HttpStatic config add: missing required flag: ${flag}`);
  return text;
}

function textOrDefault(input: unknown, flag: string, fallback: string): string {
  if (input === undefined || input === null) return fallback;
  return requireText(input, flag);
}

function parsePort(input: unknown): number {
  if (input === undefined || input === null) return DEFAULT_PORT;
  const text = requireText(input, '--port');
  const port = Number(text);
  if (!Is.num(port) || !Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('HttpStatic config add: --port must be an integer between 0 and 65535.');
  }
  return port;
}

function stringifyConfig(doc: t.HttpStatic.ConfigDoc): string {
  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) {
    throw new Error('HttpStatic config add: failed to stringify config.');
  }
  return yaml.data;
}

function validateConfigText(text: string, path: t.StringPath): void {
  parseConfigText(text, path);
}

function parseConfigText(text: string, path: t.StringPath): t.HttpStatic.ConfigDoc {
  const parsed = Yaml.parse<unknown>(text);
  if (parsed.error) {
    throw new Error(`HttpStatic config add: invalid config YAML: ${Fs.trimCwd(path)}`, {
      cause: parsed.error,
    });
  }

  const data = parsed.data;
  if (!Is.record(data)) {
    throw new Error(`HttpStatic config add: config must be a YAML object: ${Fs.trimCwd(path)}`);
  }

  assertKnownKeys(data, path);
  return {
    name: readNonEmptyString(data, 'name', path),
    dir: readNonEmptyString(data, 'dir', path),
    hostname: readNonEmptyString(data, 'hostname', path),
    port: readPort(data.port, path),
  };
}

function assertKnownKeys(doc: Record<string, unknown>, path: t.StringPath): void {
  const allowed = ['name', 'dir', 'hostname', 'port'];
  const unknown = Object.keys(doc).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(
      `HttpStatic config add: unknown config key '${unknown[0]}': ${Fs.trimCwd(path)}`,
    );
  }
}

function readNonEmptyString(
  doc: Record<string, unknown>,
  key: keyof t.HttpStatic.ConfigDoc,
  path: t.StringPath,
): string {
  const value = doc[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `HttpStatic config add: config key '${key}' must be a non-empty string: ${Fs.trimCwd(path)}`,
    );
  }
  return value.trim();
}

function readPort(value: unknown, path: t.StringPath): number {
  if (!Is.num(value) || !Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error(
      `HttpStatic config add: config key 'port' must be an integer between 0 and 65535: ${
        Fs.trimCwd(path)
      }`,
    );
  }
  return value;
}

function sameConfig(a: t.HttpStatic.ConfigDoc, b: t.HttpStatic.ConfigDoc): boolean {
  return a.name === b.name && a.dir === b.dir && a.hostname === b.hostname && a.port === b.port;
}
