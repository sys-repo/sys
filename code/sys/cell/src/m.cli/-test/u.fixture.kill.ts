import { Fs, Str, type t, Testing, Time } from '../../-test.ts';
import { CellPaths } from '../../m.cell/u/paths.ts';
import { CellSession } from '../u/u.session.ts';

export const DEAD_PID = 999_999_999;

const HOLD_SERVICE_SOURCE = Str.dedent(`
  export const HoldService = {
    start() {
      return {
        finished: new Promise(() => undefined),
        close() {},
        status() {
          return { state: 'ready' };
        },
      };
    },
  };
`).trimStart();

const RESOURCE_SERVICE_SOURCE = Str.dedent(`
  export const ResourceService = {
    async resources(args) {
      const config = JSON.parse(await Deno.readTextFile(args.paths.config));
      const resource = { kind: 'tcp-listener', port: config.port };
      if (config.host) resource.host = config.host;
      return [resource];
    },
    start() {
      return {
        finished: new Promise(() => undefined),
        close() {},
        status() {
          return { state: 'ready' };
        },
      };
    },
  };
`).trimStart();

export async function cellFixture(name: string) {
  const fs = await Testing.dir(name);
  await Fs.write(
    Fs.join(fs.dir, CellPaths.descriptor),
    Str.dedent(`
      kind: cell
      version: 1
    `).trimStart(),
  );
  return fs;
}

export async function addHoldService(root: string) {
  await Fs.write(
    Fs.join(root, CellPaths.descriptor),
    Str.dedent(`
      kind: cell
      version: 1

      services:
        - name: hold
          use: HoldService
          from: ./-services/hold.ts
          config: ./-config/hold.yaml
    `).trimStart(),
  );
  await Fs.write(Fs.join(root, '-services/hold.ts'), HOLD_SERVICE_SOURCE);
}

export async function addResourceService(
  root: string,
  input: {
    readonly base?: ResourceConfig;
    readonly variants?: Readonly<Record<string, ResourceConfig>>;
  },
) {
  const base = input.base ?? { port: 1 };
  const variants = input.variants ?? {};

  await Fs.write(
    Fs.join(root, CellPaths.descriptor),
    resourceServiceDescriptor(variants),
  );
  await Fs.write(Fs.join(root, '-services/resource.ts'), RESOURCE_SERVICE_SOURCE);
  await writeResourceConfig(root, 'default', base);
  for (const [mode, config] of Object.entries(variants)) {
    await writeResourceConfig(root, mode, config);
  }
}

export type ResourceConfig = {
  readonly host?: string;
  readonly port: number;
};

export function sessionOf(input: {
  readonly id?: string;
  readonly root: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly pid?: number;
  readonly updatedAt?: t.UnixTimestamp;
  readonly resources?: readonly CellSession.Resource[];
}): CellSession.Session {
  const now = Time.now.timestamp;
  return {
    id: input.id ?? 'session',
    root: input.root,
    mode: input.mode ?? 'default',
    pid: input.pid ?? Deno.pid,
    startedAt: now,
    updatedAt: input.updatedAt ?? now,
    state: 'ready',
    services: [],
    resources: input.resources ?? [],
  };
}

export async function sessionRoot(root: string) {
  const real = await Fs.realPath(root);
  return real as t.StringDir;
}

export async function writeSession(dir: string, session: CellSession.Session) {
  await CellSession.write(session, { dir });
  return session;
}

export async function withRuntimeDir<T>(dir: string, fn: () => Promise<T>) {
  const key = CellSession.D.env;
  const previous = Deno.env.get(key);
  Deno.env.set(key, dir);
  try {
    return await fn();
  } finally {
    if (previous === undefined) Deno.env.delete(key);
    else Deno.env.set(key, previous);
  }
}

export async function runCellCli(
  argv: readonly string[],
  options: { readonly cwd: string; readonly runtime: string },
) {
  return await runDenoCellCli(Fs.join(Deno.cwd(), 'src/m.cli/mod.ts'), argv, {
    cwd: options.cwd,
    runtime: options.runtime,
  });
}

export async function runRootCellCli(
  argv: readonly string[],
  options: { readonly runtime: string },
) {
  return await runDenoCellCli(Fs.join(Deno.cwd(), 'src/mod.ts'), argv, {
    cwd: Deno.cwd(),
    runtime: options.runtime,
  });
}

export function spawnCellStart(root: string, runtime: string) {
  return new Deno.Command(Deno.execPath(), {
    args: ['run', '-P=test', './src/m.cli/mod.ts', 'start', root],
    cwd: Deno.cwd(),
    env: { [CellSession.D.env]: runtime },
    stdin: 'null',
    stdout: 'null',
    stderr: 'null',
  }).spawn();
}

export function spawnHoldProcess() {
  return new Deno.Command(Deno.execPath(), {
    args: ['eval', 'setInterval(() => {}, 1_000);'],
    stdin: 'null',
    stdout: 'null',
    stderr: 'null',
  }).spawn();
}

export async function spawnReadyServer(port: number, host = '127.0.0.1') {
  const child = new Deno.Command(Deno.execPath(), {
    args: ['eval', readyServerSource(host, port)],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'null',
  }).spawn();
  const reader = child.stdout.getReader();
  try {
    const { value } = await reader.read();
    if (new TextDecoder().decode(value) !== 'ready\n') {
      throw new Error('server did not become ready');
    }
  } finally {
    reader.releaseLock();
  }

  const res = await fetch(`http://${host}:${port}`);
  await res.body?.cancel();
  if (res.status !== 200) throw new Error(`server responded with status ${res.status}`);

  return child;
}

export async function waitForSession(root: string, dir: string, pid: number) {
  return await Time.waitFor(async () => {
    const sessions = await CellSession.list(await sessionRoot(root), { dir });
    return sessions.find((session) => session.pid === pid && session.state === 'ready');
  }, { interval: 50, timeout: 5_000 });
}

export async function cleanup(child: Deno.ChildProcess) {
  try {
    child.kill('SIGKILL');
  } catch {
    // Ignore best-effort cleanup failures in the test finalizer.
  }

  try {
    await child.status;
  } catch {
    // Ignore child status races after forced cleanup.
  }
}

function resourceServiceDescriptor(variants: Readonly<Record<string, ResourceConfig>>) {
  const base = Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: ResourceService
        from: ./-services/resource.ts
        config: ./-config/resource.default.json
  `).trimStart();
  const variantYaml = resourceVariantsYaml(variants);
  return variantYaml ? `${base}\n${variantYaml}` : base;
}

function resourceVariantsYaml(variants: Readonly<Record<string, ResourceConfig>>) {
  const modes = Object.keys(variants);
  if (modes.length === 0) return '';

  let yaml = Str.dedent(`
    variants:
  `).trimStart();
  for (const mode of modes) {
    const variant = Str.dedent(`
      ${mode}:
        use: ResourceService
        from: ./-services/resource.ts
        config: ./-config/resource.${mode}.json
    `).trimStart();
    yaml += '\n' + Str.indent(variant, 2);
  }

  return Str.indent(yaml, 4);
}

async function writeResourceConfig(root: string, name: string, config: ResourceConfig) {
  await Fs.write(
    Fs.join(root, `-config/resource.${name}.json`),
    JSON.stringify(config),
    { force: true },
  );
}

function readyServerSource(host: string, port: number) {
  return Str.dedent(`
    Deno.serve({ hostname: ${JSON.stringify(host)}, port: ${port} }, () => new Response('ok'));
    console.info('ready');
    setInterval(() => {}, 1_000);
  `).trimStart();
}

async function runDenoCellCli(
  entry: string,
  argv: readonly string[],
  options: { readonly cwd: string; readonly runtime: string },
) {
  return await new Deno.Command(Deno.execPath(), {
    args: ['run', '--config', Fs.join(Deno.cwd(), 'deno.json'), '-P=test', entry, ...argv],
    cwd: options.cwd,
    env: { [CellSession.D.env]: options.runtime },
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}
