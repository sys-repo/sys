import { Env, Fs, HttpServer, Is, Path, type t, Yaml } from '../common.ts';
import { pkg } from '../../pkg.ts';
import { createApp } from './u.app.ts';

type F = t.StripeFixture.Lib['start'];

type FixtureConfigDoc = Pick<
  t.StripeFixture.StartArgs,
  'hostname' | 'name' | 'port' | 'strictPort'
>;

export const start: F = async (input = {}) => {
  const args = await wrangle.args(input);
  const cwd = args.cwd ?? Fs.cwd();
  const hostname = args.hostname ?? '127.0.0.1';
  const port = args.port ?? await readEnvPort(cwd);
  const { name, silent, strictPort } = args;
  const app = createApp({ cwd });
  return HttpServer.start(app, { port, strictPort, pkg, hostname, name, silent });
};

/**
 * Helpers:
 */
async function readEnvPort(cwd: t.StringDir): Promise<t.PortNumber> {
  const env = await Env.load({ cwd, search: 'upward' });
  const input = env.get('STRIPE_FIXTURE_PORT');
  const port = Number(input || 9090);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid STRIPE_FIXTURE_PORT: ${JSON.stringify(input)}`);
  }
  return port as t.PortNumber;
}

const wrangle = {
  async args(args: t.StripeFixture.StartArgs): Promise<t.StripeFixture.StartArgs> {
    const config = args.paths?.config;
    if (!config) return args;

    const doc = await loadConfig(wrangle.configPath(args));
    return {
      ...doc,
      ...args,
      port: args.port ?? doc.port,
      strictPort: args.strictPort ?? doc.strictPort,
    };
  },

  configPath(args: t.StripeFixture.StartArgs): t.StringPath {
    const path = args.paths?.config;
    if (!path) throw new Error('StripeFixture.start: missing config path.');
    if (Path.Is.absolute(path)) return Path.normalize(path) as t.StringPath;
    const cwd = args.cwd ? Fs.resolve(args.cwd) : Fs.cwd();
    return Path.resolve(cwd, path) as t.StringPath;
  },
} as const;

async function loadConfig(path: t.StringPath): Promise<FixtureConfigDoc> {
  const read = await Fs.readText(path);
  if (!read.ok) throw new Error(`StripeFixture.start: failed to read config: ${path}`);

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    throw new Error(`StripeFixture.start: invalid config YAML: ${path}`, { cause: parsed.error });
  }

  const data = parsed.data;
  if (!Is.record(data)) {
    throw new Error(`StripeFixture.start: config must be a YAML object: ${path}`);
  }

  assertKnownKeys(data, path);
  const { strictPort } = data;
  if (strictPort !== undefined && !Is.bool(strictPort)) {
    const msg = `StripeFixture.start: config key 'strictPort' must be a boolean: ${path}`;
    throw new Error(msg);
  }
  return {
    name: readNonEmptyString(data, 'name', path),
    hostname: readNonEmptyString(data, 'hostname', path) as t.StringHostname,
    port: readConfigPort(data.port, path),
    strictPort,
  };
}

function assertKnownKeys(doc: Record<string, unknown>, path: t.StringPath): void {
  const allowed = ['name', 'hostname', 'port', 'strictPort'];
  const unknown = Object.keys(doc).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`StripeFixture.start: unknown config key '${unknown[0]}': ${path}`);
  }
}

function readNonEmptyString(
  doc: Record<string, unknown>,
  key: keyof Pick<FixtureConfigDoc, 'hostname' | 'name'>,
  path: t.StringPath,
): string {
  const value = doc[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`StripeFixture.start: config key '${key}' must be a non-empty string: ${path}`);
  }
  return value.trim();
}

function readConfigPort(value: unknown, path: t.StringPath): t.PortNumber {
  if (!Is.num(value) || !Number.isInteger(value) || value <= 0 || value > 65_535) {
    throw new Error(
      `StripeFixture.start: config key 'port' must be an integer between 1 and 65535: ${path}`,
    );
  }
  return value as t.PortNumber;
}
