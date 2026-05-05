import { Str, Time, type t } from './common.ts';
import { connectCdp } from './u.chrome.cdp.ts';
import { collectBrowserErrors } from './u.chrome.errors.ts';
import { chromeNotFoundError, findChrome } from './u.chrome.find.ts';
import { launchModes, startChrome } from './u.chrome.launch.ts';

const DEFAULT_WAIT_AFTER_LOAD = 750;
const CDP_CONNECT_TIMEOUT = 5_000;
const PAGE_LOAD_TIMEOUT = 15_000;

export async function loadChrome(url: string, options: t.Browser.Load.Options = {}): Promise<t.Browser.Load.Result> {
  const browser: t.Browser.Kind = 'Chrome';
  const executablePath = options.executablePath ?? await findChrome();
  if (!executablePath) throw await chromeNotFoundError();

  const startupFailures: string[] = [];
  for (const mode of launchModes()) {
    const start = await startChrome(executablePath, mode);
    if (!start.ok) {
      startupFailures.push(start.summary);
      continue;
    }

    const errors: string[] = [];
    try {
      const cdp = await connectCdpWithRetry(start.browserWs);
      try {
        const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', {
          url: 'about:blank',
        });
        const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
          targetId,
          flatten: true,
        });

        cdp.on(collectBrowserErrors(errors, sessionId));

        await cdp.send('Runtime.enable', {}, sessionId);
        await cdp.send('Log.enable', {}, sessionId);
        await cdp.send('Page.enable', {}, sessionId);

        const load = cdp.waitFor('Page.loadEventFired', sessionId, PAGE_LOAD_TIMEOUT);
        await cdp.send('Page.navigate', { url }, sessionId);
        await load;
        await Time.wait(options.waitAfterLoad ?? DEFAULT_WAIT_AFTER_LOAD);
      } finally {
        await cdp.send('Browser.close').catch(() => undefined);
        cdp.close();
      }
    } finally {
      await start.dispose();
    }

    const fatal = options.allowError ? errors.filter((text) => !options.allowError?.(text)) : errors;
    return {
      ok: fatal.length === 0,
      url,
      browser,
      executablePath,
      errors: fatal,
      stderr: start.stderr(),
    };
  }

  throw new Error(Str.dedent(`
    Browser.load: Chrome failed to start a DevTools Protocol endpoint.

    Chrome executable: ${executablePath}
    Attempts: ${startupFailures.length}

    ${startupFailures.join('\n\n')}
  `).trim());
}

/**
 * Helpers:
 */
async function connectCdpWithRetry(browserWs: string) {
  const started = Date.now();
  let lastError: unknown;
  while (Date.now() - started < CDP_CONNECT_TIMEOUT) {
    try {
      return await connectCdp(browserWs);
    } catch (error) {
      lastError = error;
      await Time.wait(100);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to connect to Chrome DevTools Protocol: ${message}`);
}
