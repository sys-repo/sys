import { Err, type t, Time } from './common.ts';
import { connectCdp } from './u.chrome.cdp.ts';
import { validateChromeExecutable } from './u.chrome.executable.ts';
import { chromeNotFoundError, findChrome } from './u.chrome.find.ts';
import { launchModes, startChrome } from './u.chrome.launch.ts';

const CDP_CONNECT_TIMEOUT = 5_000;
const CDP_CONNECT_ATTEMPT_TIMEOUT = 1_000;
const BROWSER_CLOSE_TIMEOUT = 5_000;

/** Start one isolated, sandbox-preserving Chrome/CDP session. */
export async function openChromeSession(
  options: { executablePath?: t.StringAbsolutePath } = {},
): Promise<t.Browser.Chrome.Session> {
  const selectedPath = options.executablePath ?? await findChrome();
  if (!selectedPath) throw await chromeNotFoundError();
  const executablePath = await validateChromeExecutable(selectedPath);

  const startupFailures: t.Browser.Chrome.Start.Failure[] = [];
  for (const mode of launchModes()) {
    const start = await startChrome(executablePath, mode);
    if (!start.ok) {
      startupFailures.push(start);
      if (start.cleanup.length > 0) throw chromeStartupError(startupFailures);
      continue;
    }

    try {
      const cdp = await connectCdpWithRetry(start.browserWs);
      let closePromise: Promise<void> | undefined;
      return {
        executablePath,
        mode: mode.name,
        cdp,
        stderr: start.stderr,
        close(primary) {
          return closePromise ??= closeChromeSession(cdp, start, primary);
        },
      };
    } catch (cause) {
      const primary = Err.std(cause);
      const cleanup = await start.close();
      if (cleanup.length > 0) throw combinePrimaryAndCleanup(primary, cleanup);
      startupFailures.push(
        Object.freeze({ ok: false, mode: mode.name, error: primary.message, cleanup }),
      );
    }
  }

  throw chromeStartupError(startupFailures);
}

/** Close the browser/CDP endpoint, prove process exit, then remove its isolated profile. */
export async function closeChromeSession(
  cdp: t.Browser.Chrome.Cdp.Client,
  start: t.Browser.Chrome.Start.Started,
  primary?: unknown,
) {
  const browserFailures: t.Browser.Chrome.Cleanup.Failure[] = [];
  try {
    await cdp.send('Browser.close', {}, undefined, BROWSER_CLOSE_TIMEOUT);
  } catch (cause) {
    browserFailures.push(
      Object.freeze({
        stage: 'browser-close' as const,
        error: Err.std(cause).message,
        unresolved: false,
      }),
    );
  } finally {
    cdp.close();
  }

  const cleanup = Object.freeze([...browserFailures, ...await start.close()]);
  if (cleanup.length > 0 && primary !== undefined) {
    throw combinePrimaryAndCleanup(primary, cleanup);
  }
  if (cleanup.length > 0) throw chromeCleanupError(cleanup);
  if (primary !== undefined) throw primary;
}

function chromeStartupError(failures: readonly t.Browser.Chrome.Start.Failure[]) {
  const attempts = failures.map((failure) => {
    const cleanup = failure.cleanup.length > 0 ? `; cleanup=${formatCleanup(failure.cleanup)}` : '';
    return `${failure.mode}: ${failure.error}${cleanup}`;
  });
  const error = new Error(
    `Chrome failed to start a sandboxed DevTools session (${attempts.join(' | ')}).`,
  );
  error.name = 'BrowserChromeStartupError';
  return error;
}

function chromeCleanupError(failures: readonly t.Browser.Chrome.Cleanup.Failure[]) {
  const error = new Error(`Chrome isolated resource cleanup failed (${formatCleanup(failures)}).`);
  error.name = 'BrowserChromeCleanupError';
  return error;
}

/** Keep the browser operation as `error`; cleanup truth is the suppressed value. */
export function combinePrimaryAndCleanup(
  primary: unknown,
  cleanup: readonly t.Browser.Chrome.Cleanup.Failure[],
) {
  const error = primary instanceof Error ? primary : Err.normalize(primary);
  return new SuppressedError(
    error,
    chromeCleanupError(cleanup),
    'Browser operation failed and isolated resource cleanup also failed.',
  );
}

function formatCleanup(failures: readonly t.Browser.Chrome.Cleanup.Failure[]) {
  return failures.map((failure) => {
    const unresolved = failure.unresolved ? ' [unresolved]' : '';
    return `${failure.stage}: ${failure.error}${unresolved}`;
  }).join(' | ');
}

export async function connectCdpWithRetry(
  browserWs: string,
  connect: t.Browser.Chrome.Cdp.Connect = connectCdp,
  timeout = CDP_CONNECT_TIMEOUT,
) {
  const deadline = Time.now.timestamp + timeout;
  let lastError: unknown;
  while (true) {
    const remaining = deadline - Time.now.timestamp;
    if (remaining < 1) break;
    try {
      return await connect(browserWs, Math.min(remaining, CDP_CONNECT_ATTEMPT_TIMEOUT));
    } catch (error) {
      lastError = error;
      const delay = Math.min(100, deadline - Time.now.timestamp);
      if (delay > 0) await Time.wait(delay);
    }
  }

  const message = Err.std(lastError).message;
  throw new Error(`Failed to connect to Chrome DevTools Protocol: ${message}`);
}
