import { Dist } from '@sys/server/dist';
import { DistServer, Fs, FsDist, Hash, Json, type t, Time } from '../common.ts';
import { BootstrapStatus } from '../../src/-test.ts';
import { startWith } from '../../src/m.cli/m.profiles/u.start/u.gui/mod.ts';
import type { Start } from '../../src/m.cli/m.profiles/u.start/u.gui/t.ts';
import { StartGuiPresentation } from '../../src/m.cli/m.profiles/u.start/u.gui/u.presentation.ts';
import {
  removeDistFixtureRoot,
  removeDistStore,
} from '../../src/m.cli/m.profiles/-test/u.fixture.start.gui.ts';
import {
  snapshotReleaseAuthority,
  START_GUI_SERVICE,
} from '../../src/m.cli/m.profiles/u.start/u.gui/u.service.ts';
import { readGuiPackage } from '../../src/m.cli/m.profiles/u.start/u.gui/u.pkg.ts';

type Candidate = Readonly<{
  dir: t.StringAbsoluteDir;
  content: t.DistContent;
  pkg: Readonly<t.Pkg>;
}>;
type Session = Readonly<{
  state: Extract<Start.Gui.Presentation.State, { kind: 'ready' | 'failed' }>;
  appStarts: number;
  bootstrapStatus: number;
  body: string;
  applicationStatus?: number;
  outcome?: Start.Gui.Outcome;
  error?: unknown;
  location?: string;
  statusBody?: string;
}>;
type SessionSettlement =
  | Readonly<{ kind: 'resolved'; outcome: Start.Gui.Outcome }>
  | Readonly<{ kind: 'rejected'; error: unknown }>;

const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');
const TEST_TMP_ROOT: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, '.tmp');
const SESSION_SETTLEMENT_TIMEOUT = 15_000;
export const DIST_DIR: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, 'dist');
const STORE_TARGETS = [
  '.pi/@sys/dist/@sys.driver-pi',
  '.pi/@sys/dist/@sys/driver-pi',
] as const;

/** Refuse an unrebuilt record; this proof never discovers or rebinds its expected pin. */
export function canonicalEvidence(): Start.Gui.Release.Evidence {
  const snapshot = snapshotReleaseAuthority();
  if (!snapshot.ok) throw snapshot.failure.error;
  const authority = snapshot.authority;
  if (authority.kind !== 'release') throw new Error('Expected release authority.');
  return Object.freeze({
    kind: 'release',
    manifestUrl: authority.source.href,
    pin: authority.pin,
    expectedPkg: authority.expectedPkg,
  });
}

export async function loadCandidate(): Promise<Candidate> {
  const source = canonicalEvidence();
  const verified = await FsDist.Pinned.verify({
    dir: DIST_DIR,
    pin: source.pin,
    limits: START_GUI_SERVICE.limits,
  });
  if (verified.kind !== 'verified') {
    throw new Error(`Driver Pi local release candidate verification failed: ${verified.kind}.`);
  }
  const observed = await readGuiPackage(DIST_DIR, verified.evidence.content);
  if (
    !observed || observed.name !== source.expectedPkg.name ||
    observed.version !== source.expectedPkg.version
  ) throw new Error('Driver Pi local release candidate package identity refused.');
  return Object.freeze({ dir: DIST_DIR, content: verified.evidence.content, pkg: observed });
}

export function startLocalServe(dir: t.StringAbsoluteDir) {
  return DistServer.Local.start({
    dir,
    limits: START_GUI_SERVICE.limits,
    hostname: '127.0.0.1',
    port: 0,
    silent: true,
    keyboard: false,
  });
}

export function evidenceAt(origin: t.StringUrl): Start.Gui.Release.Evidence {
  return Object.freeze({
    ...canonicalEvidence(),
    manifestUrl: `${numericLoopbackOrigin(origin)}/dist.json`,
  });
}

export async function startTamperedTransport(kind: 'manifest' | 'metadata' | 'asset') {
  const candidate = await loadCandidate();
  const upstream = await DistServer.Local.start({
    dir: candidate.dir,
    limits: START_GUI_SERVICE.limits,
    hostname: '127.0.0.1',
    port: 0,
    silent: true,
    keyboard: false,
  });
  const asset = Object.keys(candidate.content.parts)[0];
  if (!asset) {
    const cause = new Error('Unable to select candidate asset.');
    try {
      await upstream.close('driver-pi.release-local.missing-tamper-target');
    } catch (cleanupCause) {
      throw new SuppressedError(
        cause,
        cleanupCause,
        'Driver Pi tamper target selection and cleanup failed.',
      );
    }
    throw cause;
  }
  const tamperedRoute = kind === 'asset'
    ? `/${asset.split('/').map(encodeURIComponent).join('/')}`
    : '/dist.json';
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
        let changed: Uint8Array<ArrayBuffer>;
        if (kind === 'manifest') {
          const document = Json.parse<t.DistPkg>(new TextDecoder().decode(current));
          const part = FsDist.Part.parse(candidate.content.parts[asset]);
          if (!part) throw new Error('Expected admitted candidate part.');
          const parts = {
            ...candidate.content.parts,
            [asset]: `${Hash.sha256('substituted inventory')}:size=${part.size}`,
          };
          changed = new TextEncoder().encode(Json.stringify({
            ...document,
            hash: {
              ...candidate.content,
              parts,
              digest: Hash.sha256(FsDist.Content.encode(parts)),
            },
          }));
        } else {
          // A newline changes document bytes only for metadata; asset bytes still refuse.
          changed = new Uint8Array(current.byteLength + 1);
          changed.set(current);
          changed[changed.byteLength - 1] = 0x0a;
        }
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        return new Response(changed, { status: response.status, headers });
      },
    );
  } catch (cause) {
    try {
      await upstream.close('driver-pi.release-local.tamper-startup-failed');
    } catch (cleanupCause) {
      throw new SuppressedError(
        cause,
        cleanupCause,
        'Driver Pi tamper transport startup and cleanup failed.',
      );
    }
    throw cause;
  }

  const source = evidenceAt(`http://127.0.0.1:${server.addr.port}`);
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

export function startServeTrap(source: Start.Gui.Release.Evidence) {
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
  source: Start.Gui.Release.Evidence,
): Promise<Session> {
  assertCanonicalTransportSource(source);
  const stop = new AbortController();
  const terminal = Promise.withResolvers<
    Extract<Start.Gui.Presentation.State, { kind: 'ready' | 'failed' }>
  >();
  const keyboard = Promise.withResolvers<void>();
  let capability: t.StringUrl | undefined;
  let appStarts = 0;

  const presentationDeps: Start.Gui.Presentation.Dependencies = Object.freeze({
    isInteractive: () => true,
    size: () => Object.freeze({ width: 100, height: 18 }),
    events() {
      return {
        resize$: {
          subscribe() {
            return { unsubscribe() {} };
          },
        },
        dispose() {},
      };
    },
    repaint() {},
    bindKeyboard() {
      return {
        finished: keyboard.promise,
        dispose: keyboard.resolve,
      };
    },
    shutdownKeyboard() {
      keyboard.resolve();
      return Promise.resolve();
    },
  });
  const presentation: Start.Gui.Dependencies['presentation'] = Object.freeze({
    ...StartGuiPresentation,
    prepare(input: Start.Gui.Presentation.Input) {
      const prepared = StartGuiPresentation.prepare(input, presentationDeps);
      return Object.freeze({
        status: prepared.status,
        async acquire(url: t.StringUrl) {
          const owner = await prepared.acquire(url);
          const observed: Start.Gui.Presentation.Owner = Object.freeze({
            lost: owner.lost,
            get current() {
              return owner.current;
            },
            starting: () => owner.starting(),
            ready(value) {
              owner.ready(value);
              const current = owner.current;
              if (current.kind !== 'ready') throw new Error('Expected ready presentation state.');
              terminal.resolve(current);
            },
            failed(value) {
              owner.failed(value);
              const current = owner.current;
              if (current.kind !== 'failed') throw new Error('Expected failed presentation state.');
              terminal.resolve(current);
            },
            warnOpen: () => owner.warnOpen(),
            redraw: () => owner.redraw(),
            shutdown: () => owner.shutdown(),
          });
          return observed;
        },
      });
    },
  });
  const deps: Start.Gui.Dependencies = Object.freeze({
    releaseEvidence: canonicalEvidence(),
    readPart: FsDist.Pinned.readPart,
    runtimeRoot: () => root,
    startStatus: BootstrapStatus.start,
    openGeneration(input: t.Dist.Generation.Open.Args) {
      assertCanonicalGenerationInput(root, input);
      return Dist.Generation.open(remapGenerationTransport(input, source.manifestUrl));
    },
    startApplication(input: t.DistServer.Start.Args) {
      assertCanonicalApplicationInput(input);
      appStarts += 1;
      return DistServer.start(input);
    },
    isHostError: DistServer.Error.is,
    openBrowser(_cwd: t.StringDir, url: t.StringUrl) {
      capability = url;
    },
    presentation,
  });

  const running = startWith({
    cwd: Object.freeze({ root, git: root, invoked: root }),
    until: stop.signal,
  }, deps);
  const settlement = observeSession(running);

  const timeout = Time.delay(SESSION_SETTLEMENT_TIMEOUT);
  let applicationStatus: number | undefined;
  let body = '';
  let bootstrapStatus: number | undefined;
  let location: string | undefined;
  let state: Extract<Start.Gui.Presentation.State, { kind: 'ready' | 'failed' }> | undefined;
  let statusBody: string | undefined;
  const proofResult = await settle(async () => {
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
  });
  timeout.cancel();
  stop.abort('driver-pi.release-local.proof-complete');
  keyboard.resolve();

  const settlementResult = await settle(() => settleAfterAbort(settlement));
  if (proofResult.status === 'rejected' && settlementResult.status === 'rejected') {
    throw new SuppressedError(
      proofResult.reason,
      settlementResult.reason,
      'Driver Pi local release proof failed and session settlement also failed.',
    );
  }
  if (proofResult.status === 'rejected') throw proofResult.reason;
  if (settlementResult.status === 'rejected') throw settlementResult.reason;
  const settled = settlementResult.value;
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
    ...(settled.kind === 'resolved' ? { outcome: settled.outcome } : { error: settled.error }),
  });
}

function assertCanonicalTransportSource(source: Start.Gui.Release.Evidence): void {
  const expected = canonicalEvidence();
  if (
    source.pin.scheme !== expected.pin.scheme || source.pin.digest !== expected.pin.digest ||
    source.expectedPkg.name !== expected.expectedPkg.name ||
    source.expectedPkg.version !== expected.expectedPkg.version
  ) throw new Error('Driver Pi local release transport widened canonical authority.');
}

function assertCanonicalGenerationInput(
  root: t.StringAbsoluteDir,
  input: t.Dist.Generation.Open.Args,
): void {
  const expected = canonicalEvidence();
  const sourceOrigin = new URL(expected.manifestUrl).origin;
  if (
    input.manifestUrl !== expected.manifestUrl ||
    input.pin.scheme !== expected.pin.scheme || input.pin.digest !== expected.pin.digest ||
    input.store.root !== Fs.join(root, START_GUI_SERVICE.store.root) ||
    input.store.target !== START_GUI_SERVICE.store.target ||
    input.policy.verification !== START_GUI_SERVICE.limits ||
    input.policy.manifest.sourceOrigins.length !== 1 ||
    input.policy.manifest.sourceOrigins[0] !== sourceOrigin ||
    input.policy.resources.response.sourceOrigins.length !== 1 ||
    input.policy.resources.response.sourceOrigins[0] !== sourceOrigin
  ) throw new Error('Driver Pi local release received noncanonical Generation policy.');
}

function assertCanonicalApplicationInput(input: t.DistServer.Start.Args): void {
  const expected = canonicalEvidence();
  if (
    input.pin.scheme !== expected.pin.scheme || input.pin.digest !== expected.pin.digest ||
    input.limits !== START_GUI_SERVICE.limits ||
    input.browserPolicy !== START_GUI_SERVICE.browserPolicy ||
    input.hostname !== '127.0.0.1' || input.port !== 0 || input.silent !== true
  ) throw new Error('Driver Pi local release received noncanonical application policy.');
}

function remapGenerationTransport(
  input: t.Dist.Generation.Open.Args,
  manifestUrl: t.StringUrl,
): t.Dist.Generation.Open.Args {
  const sourceOrigin: t.StringUrl = new URL(manifestUrl).origin;
  const sourceOrigins = Object.freeze([sourceOrigin]);
  return Object.freeze({
    ...input,
    manifestUrl,
    policy: Object.freeze({
      ...input.policy,
      manifest: Object.freeze({ ...input.policy.manifest, sourceOrigins }),
      resources: Object.freeze({
        ...input.policy.resources,
        response: Object.freeze({ ...input.policy.resources.response, sourceOrigins }),
      }),
    }),
  });
}

async function observeSession(
  operation: Promise<Start.Gui.Outcome>,
): Promise<SessionSettlement> {
  try {
    return Object.freeze({ kind: 'resolved', outcome: await operation });
  } catch (error) {
    return Object.freeze({ kind: 'rejected', error });
  }
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
    return await Fs.realPath(created.absolute);
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
    await removeDistStore(Fs.join(root, target));
  }
}

export async function runWithCleanup<T>(
  operation: () => Promise<T>,
  ...cleanup: readonly (() => Promise<unknown>)[]
): Promise<T> {
  const operationResult = await settle(operation);
  const cleanupResult = await settle(() => cleanupAll(...cleanup));

  if (operationResult.status === 'rejected' && cleanupResult.status === 'rejected') {
    throw new SuppressedError(
      operationResult.reason,
      cleanupResult.reason,
      'Driver Pi local release operation failed and cleanup also failed.',
    );
  }
  if (operationResult.status === 'rejected') throw operationResult.reason;
  if (cleanupResult.status === 'rejected') throw cleanupResult.reason;
  return operationResult.value;
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

async function settle<T>(operation: () => Promise<T>): Promise<PromiseSettledResult<T>> {
  try {
    return { status: 'fulfilled', value: await operation() };
  } catch (reason) {
    return { status: 'rejected', reason };
  }
}

export async function cleanupRoot(root: t.StringAbsoluteDir): Promise<void> {
  await removeDistFixtureRoot(root, () => resetStore(root));
}

export async function generationExists(
  root: t.StringAbsoluteDir,
  pin: t.DistPin,
): Promise<boolean> {
  for (const target of STORE_TARGETS) {
    if (await Fs.exists(Fs.join(root, target, 'sys.dist-v2', pin.digest))) return true;
  }
  return false;
}

function numericLoopbackOrigin(origin: t.StringUrl): t.StringUrl {
  const url = new URL(origin);
  return `http://127.0.0.1:${url.port}`;
}
