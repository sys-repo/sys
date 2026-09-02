import { Time } from '@sys/std/time';

import { DistServer, Fs, FsDist, type t } from '../common.ts';
import { BootstrapStatus } from '../../src/-test.ts';
import { start } from '../../src/m.core/m.cli.profiles/u.start/u.gui/mod.ts';
import type { BootState } from '../../src/m.core/m.cli.profiles/u.start/u.state.ts';
import { LIMITS } from '../../src/m.core/m.cli.profiles/u.start/u.limits.ts';
import { removeDistStore } from '../../src/m.core/m.cli.profiles/-test/u.fixture.start.gui.ts';
import {
  START_GUI_SERVICE,
  type StartGuiEvidence,
} from '../../src/m.core/m.cli.profiles/u/u.start.gui.service.ts';

const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');
const TEST_TMP_ROOT = Fs.join(PACKAGE_ROOT, '.tmp') as t.StringAbsoluteDir;
const SESSION_SETTLEMENT_TIMEOUT = 15_000;
export const DIST_DIR = Fs.join(PACKAGE_ROOT, 'dist') as t.StringAbsoluteDir;
const STORE_TARGETS = [
  '.pi/@sys/dist/@sys.driver-pi',
  '.pi/@sys/dist/@sys/driver-pi',
] as const;

type ReleaseEvidence = Extract<StartGuiEvidence, { kind: 'release' }>;
type TerminalState = Extract<BootState, { kind: 'ready' | 'failed' }>;
type Candidate = Readonly<{
  dir: t.StringAbsoluteDir;
  dist: t.DeepReadonly<t.DistPkg>;
}>;
type Session = Readonly<{
  state: TerminalState;
  appStarts: number;
  bootstrapStatus: number;
  body: string;
  applicationStatus?: number;
  error?: unknown;
  location?: string;
  statusBody?: string;
}>;
type SessionSettlement =
  | Readonly<{ kind: 'resolved' }>
  | Readonly<{ kind: 'rejected'; error: unknown }>;

export async function loadCandidate(): Promise<Candidate> {
  const verified = await FsDist.Pinned.verify({
    dir: DIST_DIR,
    integrity: START_GUI_SERVICE.source.integrity,
    limits: LIMITS,
  });
  if (verified.kind !== 'verified') {
    throw new Error(`Driver Pi local release candidate verification failed: ${verified.kind}.`);
  }
  return Object.freeze({ dir: DIST_DIR, dist: verified.evidence.dist });
}

export async function startLocalServe(dir: t.StringAbsoluteDir) {
  return await DistServer.Local.start({
    dir,
    limits: LIMITS,
    hostname: '127.0.0.1',
    port: 0,
    silent: true,
    keyboard: false,
  });
}

export function evidenceAt(origin: t.StringUrl): ReleaseEvidence {
  return Object.freeze({
    ...START_GUI_SERVICE.source,
    manifestUrl: `${numericLoopbackOrigin(origin)}/dist.json` as t.StringUrl,
  });
}

export async function startTamperedTransport(kind: 'manifest' | 'asset') {
  const candidate = await loadCandidate();
  const upstream = await DistServer.Local.start({
    dir: candidate.dir,
    limits: LIMITS,
    hostname: '127.0.0.1',
    port: 0,
    silent: true,
    keyboard: false,
  });
  const asset = Object.keys(candidate.dist.hash.parts)[0];
  if (!asset) {
    await upstream.close('driver-pi.release-local.missing-tamper-target');
    throw new Error('Unable to select candidate asset.');
  }
  const tamperedRoute = kind === 'manifest'
    ? '/dist.json'
    : `/${asset.split('/').map(encodeURIComponent).join('/')}`;
  const stop = new AbortController();
  let server: Deno.HttpServer<Deno.NetAddr>;
  try {
    server = Deno.serve(
      {
        hostname: '127.0.0.1',
        port: 0,
        signal: stop.signal,
        onListen() {},
      },
      async (request) => {
        const url = new URL(request.url);
        const response = await fetch(
          new URL(
            `${url.pathname}${url.search}`,
            `${numericLoopbackOrigin(upstream.origin)}/`,
          ),
          { method: request.method, redirect: 'manual' },
        );
        if (url.pathname !== tamperedRoute || request.method !== 'GET') return response;

        const current = new Uint8Array(await response.arrayBuffer());
        const changed = new Uint8Array(current.byteLength + 1);
        changed.set(current);
        changed[changed.byteLength - 1] = 0x0a;
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        return new Response(changed, { status: response.status, headers });
      },
    );
  } catch (cause) {
    await upstream.close('driver-pi.release-local.tamper-startup-failed');
    throw cause;
  }

  const source = evidenceAt(`http://127.0.0.1:${server.addr.port}` as t.StringUrl);
  let closed = false;
  return Object.freeze({
    source,
    async close() {
      if (closed) return;
      closed = true;
      stop.abort('driver-pi.release-local.tamper-complete');
      const settled = await Promise.allSettled([
        server.finished,
        upstream.close('driver-pi.release-local.tamper-complete'),
      ]);
      const failures: unknown[] = [];
      for (const result of settled) {
        if (result.status === 'rejected') failures.push(result.reason);
      }
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) {
        throw new AggregateError(failures, 'Driver Pi tamper transport cleanup failed.');
      }
    },
  });
}

export function startServeTrap(source: ReleaseEvidence) {
  const stop = new AbortController();
  const url = new URL(source.manifestUrl);
  let requests = 0;
  const server = Deno.serve(
    {
      hostname: url.hostname,
      port: Number(url.port),
      signal: stop.signal,
      onListen() {},
    },
    () => {
      requests += 1;
      return new Response(null, { status: 503 });
    },
  );
  return Object.freeze({
    get requests() {
      return requests;
    },
    async close() {
      stop.abort();
      await server.finished;
    },
  });
}

export async function runSession(
  root: t.StringAbsoluteDir,
  source: ReleaseEvidence,
): Promise<Session> {
  const stop = new AbortController();
  const terminal = Promise.withResolvers<TerminalState>();
  const keyboard = Promise.withResolvers<void>();
  let capability: t.StringUrl | undefined;
  let appStarts = 0;

  const running = start({
    cwd: Object.freeze({ root, git: root, invoked: root }),
    source,
    until: stop.signal,
    deps: {
      startStatus: BootstrapStatus.start,
      start: async (input) => {
        appStarts += 1;
        return await DistServer.start({ ...input, silent: true });
      },
      open: (_cwd, url) => {
        capability = url;
      },
      bindKeyboard: () => ({
        finished: keyboard.promise,
        dispose: keyboard.resolve,
      }),
      createScreen: (input) => {
        const release = input.state.subscribe((state) => {
          if (state.kind === 'ready' || state.kind === 'failed') terminal.resolve(state);
        });
        return {
          kind: 'acquired',
          failure: new Promise<never>(() => undefined),
          redraw() {},
          warnOpen() {},
          dispose: release,
        };
      },
    },
  });
  const settlement: Promise<SessionSettlement> = running.then(
    () => Object.freeze({ kind: 'resolved' as const }),
    (error) => Object.freeze({ kind: 'rejected' as const, error }),
  );

  const timeout = Time.delay(15_000);
  let applicationStatus: number | undefined;
  let body = '';
  let bootstrapStatus: number | undefined;
  let location: string | undefined;
  let proofFailed = false;
  let proofFailure: unknown;
  let state: TerminalState | undefined;
  let statusBody: string | undefined;
  try {
    const outcome = await Promise.race([
      terminal.promise.then((value) => ({ kind: 'state' as const, value })),
      settlement.then((value) => ({ kind: 'settled' as const, value })),
      timeout.then(() => ({ kind: 'timeout' as const })),
    ]);
    if (outcome.kind === 'timeout') {
      throw new Error('Timed out waiting for Driver Pi local release terminal state.');
    }
    if (outcome.kind === 'settled') {
      throw new Error('Driver Pi local release session settled before terminal state.', {
        cause: outcome.value.kind === 'rejected' ? outcome.value.error : undefined,
      });
    }
    state = outcome.value;

    if (!capability) throw new Error('Driver Pi local release proof missing capability URL.');
    const status = await fetch(capability, { redirect: 'manual' });
    bootstrapStatus = status.status;
    if (state.kind === 'ready') {
      location = status.headers.get('location') ?? undefined;
      await status.body?.cancel();
      if (location) {
        const response = await fetch(location);
        applicationStatus = response.status;
        body = await response.text();
      }
    } else {
      statusBody = await status.text();
    }
  } catch (cause) {
    proofFailed = true;
    proofFailure = cause;
  } finally {
    timeout.cancel();
    stop.abort('driver-pi.release-local.proof-complete');
    keyboard.resolve();
  }

  let settled: SessionSettlement | undefined;
  let settlementFailed = false;
  let settlementFailure: unknown;
  try {
    settled = await settleAfterAbort(settlement);
  } catch (cause) {
    settlementFailed = true;
    settlementFailure = cause;
  }
  if (proofFailed && settlementFailed) {
    throw new SuppressedError(
      proofFailure,
      settlementFailure,
      'Driver Pi local release proof failed and session settlement also failed.',
    );
  }
  if (proofFailed) throw proofFailure;
  if (settlementFailed) throw settlementFailure;
  if (!settled) throw new Error('Driver Pi local release proof missing settlement evidence.');
  if (!state) throw new Error('Driver Pi local release proof missing terminal state.');
  if (bootstrapStatus === undefined) {
    throw new Error('Driver Pi local release proof missing bootstrap response.');
  }
  return Object.freeze({
    state,
    appStarts,
    bootstrapStatus,
    body,
    ...(applicationStatus === undefined ? {} : { applicationStatus }),
    ...(location === undefined ? {} : { location }),
    ...(statusBody === undefined ? {} : { statusBody }),
    ...(settled.kind === 'rejected' ? { error: settled.error } : {}),
  });
}

async function settleAfterAbort(
  settlement: Promise<SessionSettlement>,
): Promise<SessionSettlement> {
  const timeout = Time.delay(SESSION_SETTLEMENT_TIMEOUT);
  try {
    const outcome = await Promise.race([
      settlement.then((value) => ({ kind: 'settled' as const, value })),
      timeout.then(() => ({ kind: 'timeout' as const })),
    ]);
    if (outcome.kind === 'timeout') {
      throw new Error('Timed out waiting for Driver Pi local release session settlement.');
    }
    return outcome.value;
  } finally {
    timeout.cancel();
  }
}

export async function temporaryRoot(prefix: string): Promise<t.StringAbsoluteDir> {
  await Fs.ensureDir(TEST_TMP_ROOT);
  const created = await Fs.makeTempDir({ dir: TEST_TMP_ROOT, prefix });
  try {
    return await Fs.realPath(created.absolute) as t.StringAbsoluteDir;
  } catch (cause) {
    try {
      await Fs.remove(created.absolute);
    } catch (cleanupCause) {
      throw new AggregateError(
        [cause, cleanupCause],
        'Driver Pi local release root acquisition and cleanup failed.',
      );
    }
    throw cause;
  }
}

export async function resetStore(root: t.StringAbsoluteDir): Promise<void> {
  for (const target of STORE_TARGETS) {
    await removeDistStore(Fs.join(root, target) as t.StringDir);
  }
}

export async function runWithCleanup<T>(
  operation: () => Promise<T>,
  ...cleanup: readonly (() => Promise<unknown>)[]
): Promise<T> {
  let completed = false;
  let value: T | undefined;
  let primary: unknown;
  try {
    value = await operation();
    completed = true;
  } catch (cause) {
    primary = cause;
  }

  let cleanupFailed = false;
  let cleanupFailure: unknown;
  try {
    await cleanupAll(...cleanup);
  } catch (cause) {
    cleanupFailed = true;
    cleanupFailure = cause;
  }

  if (!completed) {
    if (cleanupFailed) {
      throw new SuppressedError(
        primary,
        cleanupFailure,
        'Driver Pi local release operation failed and cleanup also failed.',
      );
    }
    throw primary;
  }
  if (cleanupFailed) throw cleanupFailure;
  return value as T;
}

export async function cleanupAll(
  ...operations: readonly (() => Promise<unknown>)[]
): Promise<void> {
  const failures: unknown[] = [];
  for (const operation of operations) {
    try {
      await operation();
    } catch (cause) {
      failures.push(cause);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Driver Pi local release fixture cleanup failed.');
  }
}

export async function cleanupRoot(root: t.StringAbsoluteDir): Promise<void> {
  await cleanupAll(
    () => resetStore(root),
    () => Fs.remove(root),
  );
}

export async function generationExists(
  root: t.StringAbsoluteDir,
  integrity: t.StringHash,
): Promise<boolean> {
  for (const target of STORE_TARGETS) {
    if (await Fs.exists(Fs.join(root, target, integrity))) return true;
  }
  return false;
}

function numericLoopbackOrigin(origin: t.StringUrl): t.StringUrl {
  const url = new URL(origin);
  return `http://127.0.0.1:${url.port}` as t.StringUrl;
}
