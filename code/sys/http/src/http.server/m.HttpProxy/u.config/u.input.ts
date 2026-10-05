import { D, Is, type t, YamlConfig } from '../common.ts';
import { validateMount } from './u.mount.ts';
import { validateRoot } from './u.root.ts';
import { ProxyConfigPath } from './u.path.ts';

export function resolveConfigRef(input: unknown, errorPrefix: string) {
  return YamlConfig.Ref.resolve({
    value: input,
    dir: ProxyConfigPath.dir,
    label: '--config',
    errorPrefix,
    expandTilde: true,
  });
}

export function initialConfig(
  input: {
    readonly name?: unknown;
    readonly hostname?: unknown;
    readonly port?: unknown;
  },
  ref: ReturnType<typeof resolveConfigRef>,
  errorPrefix: string,
): t.HttpProxy.Config.Doc {
  return {
    name: resolveName(input.name, ref, errorPrefix),
    hostname: textOrDefault(input.hostname, '--hostname', D.hostname, errorPrefix),
    port: parsePort(input.port, errorPrefix),
    mounts: [],
  };
}

export function parseMount(
  input: { readonly mount?: unknown; readonly upstream?: unknown },
  errorPrefix: string,
): t.HttpProxy.Mount.Doc {
  const mount = requireText(input.mount, '--mount', errorPrefix);
  const upstream = requireText(input.upstream, '--upstream', errorPrefix);
  const parsed = { path: mount as t.StringUrlRoute, target: upstream as t.StringUrl };
  validateMount(parsed, errorPrefix);
  return parsed;
}

export function parseRoot(
  input: { readonly upstream?: unknown },
  errorPrefix: string,
): t.HttpProxy.Root.Doc {
  const upstream = requireText(input.upstream, '--upstream', errorPrefix);
  const parsed = { target: upstream as t.StringUrl };
  validateRoot(parsed, errorPrefix);
  return parsed;
}

function resolveName(
  input: unknown,
  ref: ReturnType<typeof resolveConfigRef>,
  errorPrefix: string,
): string {
  if (input === undefined || input === null) return ref.name;
  const text = String(input).trim();
  if (!text) throw new Error(`${errorPrefix}: --name must not be empty.`);
  return text;
}

function requireText(input: unknown, flag: string, errorPrefix: string): string {
  const text = String(input ?? '').trim();
  if (!text) throw new Error(`${errorPrefix}: missing required flag: ${flag}`);
  return text;
}

function textOrDefault(
  input: unknown,
  flag: string,
  fallback: string,
  errorPrefix: string,
): string {
  if (input === undefined || input === null) return fallback;
  return requireText(input, flag, errorPrefix);
}

function parsePort(input: unknown, errorPrefix: string): number {
  if (input === undefined || input === null) return D.port;
  const text = requireText(input, '--port', errorPrefix);
  const port = Number(text);
  if (!Is.num(port) || !Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`${errorPrefix}: --port must be an integer between 0 and 65535.`);
  }
  return port;
}
