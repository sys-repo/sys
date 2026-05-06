import { Fs, Is, type t, Yaml } from '../common.ts';
import { normalizeMounts } from './u.mount.ts';
import { validateRoot } from './u.root.ts';

export async function loadConfig(
  path: t.StringPath,
  errorPrefix: string,
): Promise<t.HttpProxy.Config.Doc> {
  const read = await Fs.readText(path);
  if (!read.ok) throw new Error(`${errorPrefix}: failed to read config: ${Fs.trimCwd(path)}`);
  return parseConfigText(read.data ?? '', path, errorPrefix);
}

export function stringifyConfig(doc: t.HttpProxy.Config.Doc, errorPrefix: string): string {
  const yaml = Yaml.stringify(doc);
  if (yaml.error || !yaml.data) throw new Error(`${errorPrefix}: failed to stringify config.`);
  return yaml.data;
}

export function validateConfigText(text: string, path: t.StringPath, errorPrefix: string): void {
  parseConfigText(text, path, errorPrefix);
}

function parseConfigText(
  text: string,
  path: t.StringPath,
  errorPrefix: string,
): t.HttpProxy.Config.Doc {
  const parsed = Yaml.parse<unknown>(text);
  if (parsed.error) {
    const cause = parsed.error;
    throw new Error(`${errorPrefix}: invalid config YAML: ${Fs.trimCwd(path)}`, { cause });
  }

  const data = parsed.data;
  if (!Is.record(data)) {
    throw new Error(`${errorPrefix}: config must be a YAML object: ${Fs.trimCwd(path)}`);
  }

  assertKnownKeys(data, path, errorPrefix);
  const doc = {
    name: readNonEmptyString(data, 'name', path, errorPrefix),
    hostname: readNonEmptyString(data, 'hostname', path, errorPrefix),
    port: readPort(data.port, path, errorPrefix),
    root: readRoot(data.root, path, errorPrefix),
    mounts: readMounts(data.mounts, path, errorPrefix),
  } satisfies t.HttpProxy.Config.Doc;

  if (doc.root) validateRoot(doc.root, errorPrefix);
  normalizeMounts(doc.mounts, errorPrefix);
  return doc;
}

function assertKnownKeys(
  doc: Record<string, unknown>,
  path: t.StringPath,
  errorPrefix: string,
): void {
  const allowed = ['name', 'hostname', 'port', 'root', 'mounts'];
  const unknown = Object.keys(doc).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${errorPrefix}: unknown config key '${unknown[0]}': ${Fs.trimCwd(path)}`);
  }
}

function readNonEmptyString(
  doc: Record<string, unknown>,
  key: keyof Pick<t.HttpProxy.Config.Doc, 'name' | 'hostname'>,
  path: t.StringPath,
  errorPrefix: string,
): string {
  const value = doc[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    const p = Fs.trimCwd(path);
    const err = `${errorPrefix}: config key '${key}' must be a non-empty string: ${p}`;
    throw new Error(err);
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

function readRoot(
  value: unknown,
  path: t.StringPath,
  errorPrefix: string,
): t.HttpProxy.Root.Doc | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Is.record(value)) {
    throw new Error(`${errorPrefix}: config key 'root' must be a YAML object: ${Fs.trimCwd(path)}`);
  }

  const allowed = ['target'];
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${errorPrefix}: unknown root key '${unknown[0]}': ${Fs.trimCwd(path)}`);
  }

  return {
    target: readNonEmptyRootString(value, 'target', path, errorPrefix) as t.StringUrl,
  } satisfies t.HttpProxy.Root.Doc;
}

function readMounts(
  value: unknown,
  path: t.StringPath,
  errorPrefix: string,
): readonly t.HttpProxy.Mount.Doc[] {
  if (!Is.array(value)) {
    throw new Error(`${errorPrefix}: config key 'mounts' must be a list: ${Fs.trimCwd(path)}`);
  }
  return value.map((item, index) => readMount(item, `mounts[${index}]`, path, errorPrefix));
}

function readMount(
  input: unknown,
  label: string,
  path: t.StringPath,
  errorPrefix: string,
): t.HttpProxy.Mount.Doc {
  if (!Is.record(input)) {
    throw new Error(`${errorPrefix}: ${label} must be a YAML object: ${Fs.trimCwd(path)}`);
  }

  const allowed = ['path', 'target'];
  const unknown = Object.keys(input).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${errorPrefix}: unknown ${label} key '${unknown[0]}': ${Fs.trimCwd(path)}`);
  }

  return {
    path: readNonEmptyMountString(input, 'path', label, path, errorPrefix) as t.StringUrlRoute,
    target: readNonEmptyMountString(input, 'target', label, path, errorPrefix) as t.StringUrl,
  } satisfies t.HttpProxy.Mount.Doc;
}

function readNonEmptyRootString(
  doc: Record<string, unknown>,
  key: keyof t.HttpProxy.Root.Doc,
  path: t.StringPath,
  errorPrefix: string,
): string {
  const value = doc[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    const err = `${errorPrefix}: root.${key} must be a non-empty string: ${Fs.trimCwd(path)}`;
    throw new Error(err);
  }
  return value.trim();
}

function readNonEmptyMountString(
  doc: Record<string, unknown>,
  key: keyof Pick<t.HttpProxy.Mount.Doc, 'path' | 'target'>,
  label: string,
  path: t.StringPath,
  errorPrefix: string,
): string {
  const value = doc[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    const err = `${errorPrefix}: ${label}.${key} must be a non-empty string: ${Fs.trimCwd(path)}`;
    throw new Error(err);
  }
  return value.trim();
}
