import { Env, Fs, Net, Process, Time, type t } from './common.ts';
import { connectCdp, waitForBrowserWs } from './u.chrome.cdp.ts';

const DEFAULT_WAIT_AFTER_LOAD = 750;

export async function loadChrome(url: string, options: t.Browser.Load.Options = {}): Promise<t.Browser.Load.Result> {
  const browser: t.Browser.Kind = 'Chrome';
  const executablePath = options.executablePath ?? await findChrome();
  if (!executablePath) throw await chromeNotFoundError();

  const debugPort = Net.Port.random();
  const userDataDir = (await Fs.makeTempDir({ prefix: 'sys-testing-chrome-' })).absolute;
  const errors: string[] = [];

  let stderr = '';
  const proc = Process.spawn({
    cmd: executablePath,
    args: [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      '--no-sandbox',
      '--disable-dev-shm-usage',
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
    const browserWs = await waitForBrowserWs(debugPort, { timeout: 20_000 }).catch((cause) => {
      throw chromeStartError({ cause, executablePath, stderr });
    });
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
    await Fs.remove(userDataDir).catch(() => undefined);
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
  for (const path of await chromeCandidates()) {
    if (await exists(path)) return path;
  }
  return undefined;
}

async function chromeCandidates() {
  const env = (await Env.load()).get('CHROME_BIN');
  return [
    ...(env ? [env] : []),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
}

async function chromeNotFoundError() {
  return new Error([
    'Browser.load: Chrome executable not found.',
    '',
    'Attempted browser: Chrome',
    'Lookup order:',
    '  1. options.executablePath',
    '  2. CHROME_BIN',
    ...(await chromeCandidates()).map((path) => `  - ${path}`),
    '',
    'Fix: install Chrome/Chromium or set CHROME_BIN to the browser executable.',
    'Note: `deno task test` runs the Browser.load integration proof for @sys/testing.',
  ].join('\n'));
}

function chromeStartError(args: { cause: unknown; executablePath: string; stderr: string }) {
  const message = args.cause instanceof Error ? args.cause.message : String(args.cause);
  return new Error([
    `Browser.load: ${message}`,
    '',
    `Chrome executable: ${args.executablePath}`,
    args.stderr ? `Chrome stderr:\n${args.stderr}` : 'Chrome stderr: <empty>',
  ].join('\n'));
}

async function exists(path: string) {
  return Fs.exists(path);
}
