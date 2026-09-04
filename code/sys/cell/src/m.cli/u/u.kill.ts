import { Cell } from '../../m.cell/mod.ts';
import { Process, type t } from '../common.ts';
import { formatKillResult } from './u.kill.fmt.ts';
import { loadCanonicalRoot } from './u.root.ts';
import { CellSession } from './u.session.ts';

export type KillCellArgs = {
  readonly dir?: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly dryRun?: boolean;
  readonly force?: boolean;
  readonly sessionDir?: string;
  readonly freshFor?: t.Msecs;
};

export type KillCellResult = {
  readonly root: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly sessions: readonly KillSessionResult[];
  readonly resources: readonly KillResourceResult[];
  readonly code: number;
};

type KillSessionResult = t.CellCli.Kill.SessionResult & {
  readonly terminate?: t.Process.Terminate.Result;
};

type KillResourceResult = t.CellCli.Kill.ResourceResult & {
  readonly mode: t.Cell.Services.ServiceMode;
  readonly terminate?: t.Process.Terminate.Port.Result;
};

type SessionObservation = {
  readonly session: CellSession.Session;
  readonly fresh: boolean;
  readonly running: boolean;
};

type ResourceDeclaration = {
  readonly mode: t.Cell.Services.ServiceMode;
  readonly service: string;
  readonly resource: t.Service.Resource.Any;
  readonly blocked?: string;
};

export async function killCell(args: KillCellArgs = {}): Promise<KillCellResult> {
  const root = await loadCanonicalRoot(args.dir);
  const options = sessionOptions(args);
  const sessions = (await CellSession.list(root, options)).filter((session) => {
    return args.mode === undefined || session.mode === args.mode;
  });
  const observations = sessions.map((session) => observeSession(session, args));
  const declarations = await resourceDeclarations(root, observations, args);

  const sessionResults: KillSessionResult[] = [];
  if (args.dryRun) {
    for (const observation of observations) sessionResults.push(dryRunSession(observation));
  } else {
    for (const observation of observations) sessionResults.push(await killSession(observation, args));
  }

  const resources = await killResources(declarations, sessionResults, args);

  return {
    root,
    ...(args.mode ? { mode: args.mode } : {}),
    dryRun: args.dryRun ?? false,
    force: args.force ?? false,
    sessions: sessionResults,
    resources,
    code: exitCode(sessionResults, resources, args.dryRun ?? false),
  };
}

export function toKillResult(
  input: t.CellCli.Input,
  res: KillCellResult,
): t.CellCli.Kill.Result {
  return {
    kind: 'kill',
    input,
    text: formatKillResult(res),
    code: res.code,
    root: res.root,
    ...(res.mode ? { mode: res.mode } : {}),
    dryRun: res.dryRun,
    force: res.force,
    sessions: res.sessions.map(publicSessionResult),
    resources: res.resources.map(publicResourceResult),
  };
}

function observeSession(session: CellSession.Session, args: KillCellArgs): SessionObservation {
  return {
    session,
    fresh: CellSession.isFresh(session, sessionOptions(args)),
    running: Process.isRunning(session.pid),
  };
}

function dryRunSession(observation: SessionObservation): KillSessionResult {
  const { fresh, running, session } = observation;
  return sessionResult(session, {
    fresh,
    status: running ? (fresh ? 'would-terminate' : 'stale-running') : 'would-remove-stale',
  });
}

async function killSession(
  observation: SessionObservation,
  args: KillCellArgs,
): Promise<KillSessionResult> {
  const options = sessionOptions(args);
  const { fresh, running, session } = observation;

  if (!running) {
    await CellSession.remove(session, options);
    return sessionResult(session, { fresh, status: 'not-running' });
  }

  if (!fresh) return sessionResult(session, { fresh, status: 'stale-running' });

  const terminate = await Process.Terminate.pid(session.pid, { force: args.force ?? false });
  if (terminate.status !== 'still-running') await CellSession.remove(session, options);

  return sessionResult(session, { fresh, status: terminate.status, terminate });
}

async function resourceDeclarations(
  root: string,
  observations: readonly SessionObservation[],
  args: KillCellArgs,
): Promise<readonly ResourceDeclaration[]> {
  const modes = resourceModes(observations, args);
  if (modes.length === 0) return [];

  const declarations: ResourceDeclaration[] = [];
  let cell: t.Cell.Instance | undefined;

  for (const mode of modes) {
    const modeObservations = observations.filter((item) => item.session.mode === mode);
    const sessionResources = modeObservations.flatMap((item) => sessionResourcesOf(item.session));
    const blocked = blockedResourceReason(modeObservations.map((item) => dryRunSession(item)));

    if (blocked) {
      declarations.push(...sessionResources.map((item) => ({ ...item, blocked })));
      continue;
    }

    if (sessionResources.length > 0) {
      declarations.push(...sessionResources);
      continue;
    }

    cell ??= await Cell.load(root);
    const planned = await safePlannedResources(cell, mode);
    declarations.push(...planned.map((item) => ({
      mode,
      service: item.service.name,
      resource: item.resource,
    })));
  }

  return uniqueResourceDeclarations(declarations);
}

async function safePlannedResources(
  cell: t.Cell.Instance,
  mode: t.Cell.Services.ServiceMode,
): Promise<readonly t.Cell.Services.PlannedResource[]> {
  try {
    return (await Cell.Services.resources(cell, { mode })).resources;
  } catch (cause) {
    if (isUnknownServiceMode(cause, mode)) return [];
    throw cause;
  }
}

async function killResources(
  declarations: readonly ResourceDeclaration[],
  sessions: readonly KillSessionResult[],
  args: KillCellArgs,
): Promise<readonly KillResourceResult[]> {
  const results: KillResourceResult[] = [];

  for (const declaration of declarations) {
    const blocked = declaration.blocked ?? blockedResourceReason(
      sessions.filter((session) => session.mode === declaration.mode),
    );
    if (blocked) {
      results.push(resourceResult(declaration, { status: 'skipped', reason: blocked }));
      continue;
    }

    if (args.dryRun) results.push(await dryRunResource(declaration));
    else results.push(await terminateResource(declaration, args));
  }

  return results;
}

async function dryRunResource(declaration: ResourceDeclaration): Promise<KillResourceResult> {
  const listeners = await Process.Port.listeners(resourceTarget(declaration.resource));
  return resourceResult(declaration, {
    status: listeners.length === 0 ? 'not-listening' : 'would-terminate',
    listeners,
  });
}

async function terminateResource(
  declaration: ResourceDeclaration,
  args: KillCellArgs,
): Promise<KillResourceResult> {
  const terminate = await Process.Terminate.port(resourceTarget(declaration.resource), {
    force: args.force ?? false,
  });
  return resourceResult(declaration, {
    status: terminate.status,
    listeners: terminate.listeners,
    terminate,
  });
}

function resourceModes(
  observations: readonly SessionObservation[],
  args: KillCellArgs,
): readonly t.Cell.Services.ServiceMode[] {
  if (args.mode) return [args.mode];
  return Array.from(new Set(observations.map((item) => item.session.mode))).sort();
}

function sessionResourcesOf(session: CellSession.Session): readonly ResourceDeclaration[] {
  return session.resources.map((item) => ({
    mode: session.mode,
    service: item.service,
    resource: item.resource,
  }));
}

function resourceTarget(resource: t.Service.Resource.Any): t.Process.Port.TargetInput {
  return resource.host ? { port: resource.port, host: resource.host } : { port: resource.port };
}

function resourceResult(
  declaration: ResourceDeclaration,
  input: {
    readonly status: t.CellCli.Kill.ResourceStatus;
    readonly listeners?: readonly t.Process.Port.Listener[];
    readonly reason?: string;
    readonly terminate?: t.Process.Terminate.Port.Result;
  },
): KillResourceResult {
  return {
    mode: declaration.mode,
    service: declaration.service,
    kind: declaration.resource.kind,
    ...(declaration.resource.host ? { host: declaration.resource.host } : {}),
    port: declaration.resource.port,
    status: input.status,
    listeners: (input.listeners ?? []).map((listener) => ({
      pid: listener.pid,
      ...(listener.command ? { command: listener.command } : {}),
    })),
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.terminate ? { terminate: input.terminate } : {}),
  };
}

function uniqueResourceDeclarations(
  declarations: readonly ResourceDeclaration[],
): readonly ResourceDeclaration[] {
  const seen = new Set<string>();
  const unique: ResourceDeclaration[] = [];

  for (const declaration of declarations) {
    const key = [
      declaration.mode,
      declaration.service,
      declaration.resource.kind,
      declaration.resource.host ?? '',
      String(declaration.resource.port),
      declaration.blocked ?? '',
    ].join('\u0000');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(declaration);
  }

  return unique;
}

function isUnknownServiceMode(cause: unknown, mode: t.Cell.Services.ServiceMode) {
  return cause instanceof Error &&
    cause.message === `Cell.Services.resources: unknown service mode '${mode}'.`;
}

function sessionOptions(args: KillCellArgs) {
  return { dir: args.sessionDir, freshFor: args.freshFor };
}

function sessionResult(
  session: CellSession.Session,
  input: {
    readonly fresh: boolean;
    readonly status: t.CellCli.Kill.SessionStatus;
    readonly terminate?: t.Process.Terminate.Result;
  },
): KillSessionResult {
  return {
    id: session.id,
    mode: session.mode,
    pid: session.pid,
    state: session.state,
    status: input.status,
    fresh: input.fresh,
    updatedAt: session.updatedAt,
    ...(input.terminate ? { terminate: input.terminate } : {}),
  };
}

function publicSessionResult(session: KillSessionResult): t.CellCli.Kill.SessionResult {
  return {
    id: session.id,
    mode: session.mode,
    pid: session.pid,
    state: session.state,
    status: session.status,
    fresh: session.fresh,
    updatedAt: session.updatedAt,
  };
}

function publicResourceResult(resource: KillResourceResult): t.CellCli.Kill.ResourceResult {
  return {
    service: resource.service,
    kind: resource.kind,
    ...(resource.host ? { host: resource.host } : {}),
    port: resource.port,
    status: resource.status,
    listeners: resource.listeners,
    ...(resource.reason ? { reason: resource.reason } : {}),
  };
}

function exitCode(
  sessions: readonly KillSessionResult[],
  resources: readonly KillResourceResult[],
  dryRun: boolean,
) {
  if (dryRun) return 0;
  if (sessions.some(isSkippedSession)) return 1;
  return resources.some(isSkippedResource) ? 1 : 0;
}

function isSkippedSession(session: KillSessionResult) {
  return session.status === 'still-running' || session.status === 'stale-running';
}

function isSkippedResource(resource: KillResourceResult) {
  return ['partial', 'still-running', 'skipped'].includes(resource.status);
}

function blockedResourceReason(sessions: readonly Pick<KillSessionResult, 'status'>[]) {
  if (sessions.some((session) => session.status === 'stale-running')) {
    return 'matching session has stale heartbeat';
  }
  if (sessions.some((session) => session.status === 'still-running')) {
    return 'matching session is still running';
  }
  return undefined;
}
