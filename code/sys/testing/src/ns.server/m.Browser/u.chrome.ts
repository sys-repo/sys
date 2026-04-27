import { Net, Process, Time, type t } from './common.ts';
import { connectCdp, waitForBrowserWs } from './u.chrome.cdp.ts';

const DEFAULT_WAIT_AFTER_LOAD = 750;

export async function loadChrome(url: string, options: t.Browser.Load.Options = {}): Promise<t.Browser.Load.Result> {
  const browser: t.Browser.Kind = 'Chrome';
  const executablePath = options.executablePath ?? await findChrome();
  if (!executablePath) throw chromeNotFoundError();

  const debugPort = Net.Port.random();
  const userDataDir = await Deno.makeTempDir({ prefix: 'sys-testing-chrome-' });
  const errors: string[] = [];

  let stderr = '';
  const proc = Process.spawn({
    cmd: executablePath,
    args: [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-sync',
      '--no-default-browser-check',
      '--no-first-run',
      'about:blank',
    ],
    silent: true,
  }).onStdErr((e) => (stderr += e.toString()));

  try {
    const browserWs = await waitForBrowserWs(debugPort);
    const cdp = await connectCdp(browserWs);
    try {
      const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', {
        url: 'about:blank',
      });
      const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
        targetId,
        flatten: true,
      });

      cdp.on((msg) => {
        if (msg.sessionId !== sessionId) return;
        const params = objectParams(msg.params);
        if (msg.method === 'Runtime.exceptionThrown') {
          errors.push(runtimeExceptionText(params));
        }
        if (msg.method === 'Runtime.consoleAPICalled' && params.type === 'error') {
          errors.push(consoleArgsText(params.args));
        }
        if (msg.method === 'Log.entryAdded') {
          const entry = objectParams(params.entry);
          if (entry.level === 'error') errors.push([entry.text, entry.url].filter(Boolean).join(' '));
        }
      });

      await cdp.send('Runtime.enable', {}, sessionId);
      await cdp.send('Log.enable', {}, sessionId);
      await cdp.send('Page.enable', {}, sessionId);

      const load = cdp.waitFor('Page.loadEventFired', sessionId, 10_000);
      await cdp.send('Page.navigate', { url }, sessionId);
      await load;
      await Time.wait(options.waitAfterLoad ?? DEFAULT_WAIT_AFTER_LOAD);
    } finally {
      await cdp.send('Browser.close').catch(() => undefined);
      cdp.close();
    }
  } finally {
    await proc.dispose();
    await Deno.remove(userDataDir, { recursive: true }).catch(() => undefined);
  }

  const fatal = options.allowError ? errors.filter((text) => !options.allowError?.(text)) : errors;
  return { ok: fatal.length === 0, url, browser, executablePath, errors: fatal, stderr };
}

/**
 * Helpers:
 */
function runtimeExceptionText(params: Record<string, unknown>) {
  const detail = objectParams(params.exceptionDetails);
  const exception = objectParams(detail.exception);
  return stringOr(exception.description, detail.text, 'Runtime.exceptionThrown');
}

function consoleArgsText(input: unknown) {
  return Array.isArray(input) ? input.map((item) => argText(item)).join(' ') : '';
}

function argText(input: unknown) {
  const arg = objectParams(input);
  return stringOr(arg.value, arg.description, '');
}

function stringOr(...values: readonly unknown[]) {
  for (const value of values) {
    if (typeof value === 'string') return value;
  }
  return '';
}

function objectParams(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
}

async function findChrome() {
  for (const path of chromeCandidates()) {
    if (await exists(path)) return path;
  }
  return undefined;
}

function chromeCandidates() {
  const env = Deno.env.get('CHROME_BIN');
  return [
    ...(env ? [env] : []),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
}

function chromeNotFoundError() {
  return new Error([
    'Browser.load: Chrome executable not found.',
    '',
    'Attempted browser: Chrome',
    'Lookup order:',
    '  1. options.executablePath',
    '  2. CHROME_BIN',
    ...chromeCandidates().map((path) => `  - ${path}`),
    '',
    'Fix: install Chrome/Chromium or set CHROME_BIN to the browser executable.',
    'Note: `deno task test` runs the Browser.load integration proof for @sys/testing.',
  ].join('\n'));
}

async function exists(path: string) {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
