import type { Process as TProcess } from '@sys/process/t';
import { Err, Fs, Process, Str, type t, Time } from './common.ts';

type ChromeProcess = Pick<TProcess.Handle, 'dispose' | 'onStdErr' | 'onStdOut'>;

const CHROME_START_TIMEOUT = 30_000;
const CHROME_CLOSE_TIMEOUT = 10_000;
const PROFILE_REMOVE_TIMEOUT = 10_000;
const MAX_START_OUTPUT = 2_000;
const CHROME_ENV = Object.freeze({ FORCE_COLOR: '0' });

export function launchModes(): readonly t.Browser.Chrome.Start.Mode[] {
  return [
    { name: 'headless-new', headlessArg: '--headless=new' },
    { name: 'headless-legacy', headlessArg: '--headless' },
  ];
}

export async function startChrome(
  executablePath: string,
  mode: t.Browser.Chrome.Start.Mode,
  deps: t.Browser.Chrome.Start.Deps = {},
): Promise<t.Browser.Chrome.Start.Result> {
  let userDataDir: string;
  try {
    userDataDir = deps.makeProfile
      ? await deps.makeProfile()
      : (await Fs.makeTempDir({ prefix: 'sys-testing-chrome-' })).absolute;
  } catch (cause) {
    return freezeStartFailure({ mode: mode.name, cause, cleanup: [] });
  }
  const args = chromeArgs({ mode, userDataDir });

  let stdout = '';
  let stderr = '';
  let resolved = false;
  let resolveDevtools!: (url: string) => void;
  const devtools = new Promise<string>((resolve) => (resolveDevtools = resolve));
  const tryResolve = () => {
    if (resolved) return;
    const browserWs = parseDevtoolsWs(`${stderr}\n${stdout}`);
    if (!browserWs) return;
    resolved = true;
    resolveDevtools(browserWs);
  };

  const invocation = Object.freeze({
    executablePath,
    args,
    clearEnv: true as const,
    env: CHROME_ENV,
  });
  let proc: ChromeProcess | undefined;
  try {
    proc = deps.spawn ? deps.spawn(invocation) : Process.spawn({
      cmd: executablePath,
      args,
      clearEnv: invocation.clearEnv,
      env: { ...invocation.env },
      silent: true,
      readySignal: () => false,
    });
    proc.onStdErr((e) => {
      stderr = appendBounded(stderr, e.toString());
      tryResolve();
    });
    proc.onStdOut((e) => {
      stdout = appendBounded(stdout, e.toString());
      tryResolve();
    });
  } catch (cause) {
    const cleanup = proc
      ? await closeChromeResources(proc, userDataDir, deps)
      : await removeProfileOnly(userDataDir, deps);
    return freezeStartFailure({ mode: mode.name, cause, cleanup, userDataDir });
  }

  const close = onceAsync(() => closeChromeResources(proc, userDataDir, deps));

  try {
    const browserWs = deps.devtoolsUrl ??
      await waitForDevtools(devtools, deps.startTimeout ?? CHROME_START_TIMEOUT);
    return {
      ok: true,
      browserWs,
      profilePath: userDataDir,
      stderr: () => sanitizeChromeOutput(stderr, userDataDir),
      close,
    };
  } catch (cause) {
    const cleanup = await close();
    return freezeStartFailure({ mode: mode.name, cause, cleanup, userDataDir });
  }
}

export function chromeArgs(args: { mode: t.Browser.Chrome.Start.Mode; userDataDir: string }) {
  return [
    args.mode.headlessArg,
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${args.userDataDir}`,
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-crash-reporter',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-gpu',
    '--disable-sync',
    '--disable-translate',
    '--enable-automation',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--password-store=basic',
    '--use-mock-keychain',
    'about:blank',
  ];
}

async function waitForDevtools(devtools: Promise<string>, timeout: number) {
  const timer = Time.delay(timeout, () => {
    throw new Error(`Timed out after ${timeout}ms waiting for Chrome DevTools Protocol.`);
  });

  try {
    return await Promise.race([devtools, timer.then(() => '')]);
  } finally {
    timer.cancel();
  }
}

function parseDevtoolsWs(text: string) {
  const match = text.match(/DevTools listening on (ws:\/\/\S+)/);
  return match?.[1];
}

function freezeStartFailure(args: {
  mode: string;
  cause: unknown;
  cleanup: readonly t.Browser.Chrome.Cleanup.Failure[];
  userDataDir?: string;
}) {
  const failure: t.Browser.Chrome.Start.Failure = {
    ok: false,
    mode: args.mode,
    error: sanitizedError(args.cause, args.userDataDir),
    cleanup: Object.freeze([...args.cleanup]),
  };
  return Object.freeze(failure);
}

async function closeChromeResources(
  proc: ChromeProcess,
  userDataDir: string,
  deps: t.Browser.Chrome.Start.Deps,
) {
  const failures: t.Browser.Chrome.Cleanup.Failure[] = [];
  const closeTimeout = deps.closeTimeout ?? CHROME_CLOSE_TIMEOUT;
  const process = await settleWithin(() => proc.dispose(), closeTimeout);
  if (process.kind === 'timeout') {
    failures.push(
      cleanupFailure(
        'process-close',
        `Timed out after ${closeTimeout}ms waiting for Chrome process exit.`,
        true,
        userDataDir,
      ),
    );
    return Object.freeze(failures);
  }
  if (process.kind === 'error') {
    failures.push(cleanupFailure('process-close', process.error, true, userDataDir));
    return Object.freeze(failures);
  }

  const profileFailure = await removeProfile(userDataDir, deps);
  if (profileFailure) failures.push(profileFailure);
  return Object.freeze(failures);
}

async function removeProfileOnly(userDataDir: string, deps: t.Browser.Chrome.Start.Deps) {
  const failure = await removeProfile(userDataDir, deps);
  return Object.freeze(failure ? [failure] : []);
}

async function removeProfile(userDataDir: string, deps: t.Browser.Chrome.Start.Deps) {
  const timeout = deps.profileRemoveTimeout ?? PROFILE_REMOVE_TIMEOUT;
  const removed = await settleWithin(
    () => deps.removeProfile ? deps.removeProfile(userDataDir) : Fs.remove(userDataDir),
    timeout,
  );
  if (removed.kind === 'value') return undefined;
  if (removed.kind === 'timeout') {
    return cleanupFailure(
      'profile-remove',
      `Timed out after ${timeout}ms removing the isolated Chrome profile.`,
      true,
      userDataDir,
    );
  }
  return cleanupFailure('profile-remove', removed.error, true, userDataDir);
}

function cleanupFailure(
  stage: t.Browser.Chrome.Cleanup.Failure['stage'],
  cause: unknown,
  unresolved: boolean,
  userDataDir?: string,
) {
  return Object.freeze({ stage, error: sanitizedError(cause, userDataDir), unresolved });
}

function sanitizedError(cause: unknown, userDataDir?: string) {
  const summary = cause instanceof AggregateError
    ? [cause.message, ...cause.errors.map((error) => Err.std(error).message)].join(' | ')
    : Err.std(cause).message;
  return Str.truncate(sanitizeChromeOutput(summary, userDataDir), 500);
}

export function sanitizeChromeOutput(text: string, userDataDir?: string) {
  let output = text;
  if (userDataDir) {
    const variants = [
      userDataDir,
      `file://${userDataDir}`,
      Fs.Path.toFileUrl(userDataDir).href,
    ].sort((a, b) => b.length - a.length);
    variants.forEach((value) => {
      output = output.replaceAll(value, '<temporary-profile>');
    });
  }
  return output
    .replace(/--user-data-dir=(?:"[^"]+"|'[^']+'|\S+)/g, '--user-data-dir=<redacted>')
    .replace(/(?:file:\/\/)?(?:\/private)?\/var\/folders\/\S+/g, '<temporary-path>')
    .replace(/\/tmp\/\S+/g, '<temporary-path>')
    .replace(
      /(?:file:\/\/\/)?[A-Za-z]:[\\/][^\s"']*sys-testing-chrome-[^\s"']*/g,
      '<temporary-path>',
    );
}

function appendBounded(current: string, next: string) {
  const combined = current + next;
  return combined.length <= MAX_START_OUTPUT ? combined : combined.slice(-MAX_START_OUTPUT);
}

function onceAsync<T>(fn: () => Promise<T>) {
  let promise: Promise<T> | undefined;
  return () => promise ?? (promise = fn());
}

async function settleWithin<T>(operation: () => Promise<T>, timeout: number): Promise<
  | { readonly kind: 'value'; readonly value: T }
  | { readonly kind: 'error'; readonly error: Error }
  | { readonly kind: 'timeout' }
> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = Promise.resolve().then(operation);
  const bounded = new Promise<{ readonly kind: 'timeout' }>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'timeout' }), timeout);
  });
  try {
    return await Promise.race([
      promise.then(
        (value) => ({ kind: 'value' as const, value }),
        (cause) => ({ kind: 'error' as const, error: Err.std(cause) }),
      ),
      bounded,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
