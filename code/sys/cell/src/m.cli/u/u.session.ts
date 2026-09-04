import { isServiceMode } from '../../m.cell/u.services/u.plan.ts';
import { cuid, Fs, Hash, Is, Json, Num, type t, Time } from '../common.ts';

export declare namespace CellSession {
  export type State = 'starting' | 'ready' | 'stopping';

  export type Session = {
    readonly id: string;
    readonly root: string;
    readonly mode: t.Cell.Services.ServiceMode;
    readonly pid: number;
    readonly startedAt: t.UnixTimestamp;
    readonly updatedAt: t.UnixTimestamp;
    readonly state: State;
    readonly services: readonly Service[];
    readonly resources: readonly Resource[];
  };

  export type Service = {
    readonly name: string;
    readonly use: string;
    readonly from: string;
  };

  export type Resource = {
    readonly service: string;
    readonly resource: t.Service.Resource.Any;
  };

  export type Options = {
    readonly dir?: string;
    readonly now?: t.UnixTimestamp;
    readonly freshFor?: t.Msecs;
  };

  export type StartInput = {
    readonly root: string;
    readonly mode: t.Cell.Services.ServiceMode;
    readonly pid: number;
    readonly services: readonly Service[];
    readonly resources?: readonly Resource[];
  };

  export type Handle = {
    readonly current: Session;
    resources(resources: readonly Resource[]): Promise<void>;
    ready(): Promise<void>;
    stopping(): Promise<void>;
    dispose(): Promise<void>;
  };
}

const D = {
  env: 'SYS_CELL_RUNTIME_DIR',
  heartbeat: 1_000 as t.Msecs,
  freshFor: 5_000 as t.Msecs,
} as const;

export const CellSession = Object.freeze(
  {
    D,
    isFresh,
    create,
    list,
    write,
    remove,
  } as const,
);

async function create(
  input: CellSession.StartInput,
  options: CellSession.Options = {},
): Promise<CellSession.Handle> {
  let current: CellSession.Session = {
    id: cuid(),
    root: input.root,
    mode: input.mode,
    pid: input.pid,
    startedAt: now(options),
    updatedAt: now(options),
    state: 'starting',
    services: input.services,
    resources: input.resources ?? [],
  };
  let disposed = false;
  let writes: Promise<void> = Promise.resolve();

  const enqueueWrite = (session: CellSession.Session) => {
    writes = writes.catch(() => undefined).then(async () => {
      if (!disposed) await write(session, options);
    });
    return writes;
  };

  const save = async (patch: Partial<CellSession.Session> = {}) => {
    if (disposed) return;
    current = { ...current, ...patch, updatedAt: now(options) };
    await enqueueWrite(current);
  };

  await write(current, options);
  const timer = globalThis.setInterval(() => {
    if (!disposed) void save().catch(() => undefined);
  }, D.heartbeat);

  return {
    get current() {
      return current;
    },
    resources: async (resources) => await save({ resources }),
    ready: async () => await save({ state: 'ready' }),
    stopping: async () => await save({ state: 'stopping' }),
    async dispose() {
      disposed = true;
      globalThis.clearInterval(timer);
      await writes.catch(() => undefined);
      await remove(current, options);
    },
  };
}

async function list(root: string, options: CellSession.Options = {}) {
  const dir = rootDir(root, options);
  if (!(await Fs.exists(dir))) return [];
  const files = await Fs.ls(dir, { includeDirs: false, depth: 1 });
  const sessions: CellSession.Session[] = [];

  for (const file of files.filter((path) => path.endsWith('.json'))) {
    const session = await read(file);
    if (session && session.root === root) sessions.push(session);
  }

  return sessions.sort((a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id));
}

async function read(file: string): Promise<CellSession.Session | undefined> {
  const res = await Fs.readText(file);
  if (!res.ok) return undefined;

  const parsed = Json.safeParse<unknown>(res.data);
  if (!parsed.ok) return undefined;

  return sessionOf(parsed.data);
}

async function write(session: CellSession.Session, options: CellSession.Options = {}) {
  const target = path(session.root, session.id, options);
  const temp = `${target}.${Deno.pid}.${cuid()}.tmp`;
  const res = await Fs.write(temp, Json.stringify(session), { throw: true });
  if (res.error) throw res.error;
  await Fs.rename(temp, target);
}

async function remove(session: CellSession.Session, options: CellSession.Options = {}) {
  await Fs.remove(path(session.root, session.id, options), { recursive: false });
}

function path(root: string, id: string, options: CellSession.Options = {}) {
  return Fs.join(rootDir(root, options), `${id}.json`);
}

function rootDir(root: string, options: CellSession.Options = {}) {
  return Fs.join(runtimeRoot(options), rootHash(root));
}

function runtimeRoot(options: CellSession.Options = {}) {
  const explicit = options.dir ?? Deno.env.get(D.env);
  if (explicit) return Fs.resolve(explicit);

  const xdg = Deno.env.get('XDG_RUNTIME_DIR');
  if (xdg) return Fs.join(xdg, '@sys/cell');

  const tmp = Deno.env.get('TMPDIR') ?? Deno.env.get('TMP') ?? Deno.env.get('TEMP') ?? '/tmp';
  const user = Deno.env.get('UID') ?? Deno.env.get('USER') ?? 'unknown';
  return Fs.join(tmp, '@sys/cell', user);
}

function isFresh(session: CellSession.Session, options: CellSession.Options = {}) {
  const age = now(options) - session.updatedAt;
  return age >= 0 && age <= (options.freshFor ?? D.freshFor);
}

function now(options: CellSession.Options) {
  return options.now ?? Time.now.timestamp;
}

function rootHash(root: string) {
  return Hash.sha256(root, { prefix: false }).slice(0, 32);
}

function sessionOf(input: unknown): CellSession.Session | undefined {
  if (!Is.record(input)) return undefined;
  if (!Is.str(input.id)) return undefined;
  if (!Is.str(input.root)) return undefined;
  if (!Is.str(input.mode) || !isServiceMode(input.mode)) return undefined;
  if (!Is.num(input.pid) || !Num.Is.safeInt(input.pid) || input.pid < 1) return undefined;
  if (!Is.num(input.startedAt) || !Num.Is.safeInt(input.startedAt)) return undefined;
  if (!Is.num(input.updatedAt) || !Num.Is.safeInt(input.updatedAt)) return undefined;
  if (!isSessionState(input.state)) return undefined;
  if (!Is.array(input.services)) return undefined;
  if (input.resources !== undefined && !Is.array(input.resources)) return undefined;

  const services: CellSession.Service[] = [];
  for (const item of input.services) {
    const service = serviceOf(item);
    if (!service) return undefined;
    services.push(service);
  }

  const resources: CellSession.Resource[] = [];
  for (const item of input.resources ?? []) {
    const resource = resourceOf(item);
    if (!resource) return undefined;
    resources.push(resource);
  }

  return {
    id: input.id,
    root: input.root,
    mode: input.mode,
    pid: input.pid,
    startedAt: input.startedAt,
    updatedAt: input.updatedAt,
    state: input.state,
    services,
    resources,
  };
}

function serviceOf(input: unknown): CellSession.Service | undefined {
  if (!Is.record(input)) return undefined;
  if (!Is.str(input.name)) return undefined;
  if (!Is.str(input.use)) return undefined;
  if (!Is.str(input.from)) return undefined;
  return { name: input.name, use: input.use, from: input.from };
}

function resourceOf(input: unknown): CellSession.Resource | undefined {
  if (!Is.record(input)) return undefined;
  if (!Is.str(input.service)) return undefined;
  const resource = serviceResourceOf(input.resource);
  if (!resource) return undefined;
  return { service: input.service, resource };
}

function serviceResourceOf(input: unknown): t.Service.Resource.Any | undefined {
  if (!Is.record(input)) return undefined;
  if (input.kind !== 'tcp-listener') return undefined;
  if (!Is.num(input.port) || !Num.Is.safeInt(input.port) || input.port < 1 || input.port > 65_535) {
    return undefined;
  }
  if (input.host !== undefined && (!Is.str(input.host) || input.host.trim().length === 0)) {
    return undefined;
  }
  const port = input.port as t.PortNumber;
  const host = input.host?.trim();
  return host ? { kind: 'tcp-listener', host, port } : { kind: 'tcp-listener', port };
}

function isSessionState(input: unknown): input is CellSession.State {
  return input === 'starting' || input === 'ready' || input === 'stopping';
}
