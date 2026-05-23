import { Fs, Process, Str, Time, type t } from './common.ts';

const CHROME_START_TIMEOUT = 30_000;

export function launchModes(): readonly t.Browser.Chrome.Mode[] {
  return [
    { name: 'headless-new', headlessArg: '--headless=new' },
    { name: 'headless-legacy', headlessArg: '--headless' },
  ];
}

export async function startChrome(
  executablePath: string,
  mode: t.Browser.Chrome.Mode,
): Promise<t.Browser.Chrome.Start> {
  const userDataDir = (await Fs.makeTempDir({ prefix: 'sys-testing-chrome-' })).absolute;
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

  const proc = Process.spawn({ cmd: executablePath, args, silent: true })
    .onStdErr((e) => {
      stderr += e.toString();
      tryResolve();
    })
    .onStdOut((e) => {
      stdout += e.toString();
      tryResolve();
    });

  const dispose = async () => {
    await proc.dispose().catch(() => undefined);
    await Fs.remove(userDataDir).catch(() => undefined);
  };

  try {
    const browserWs = await waitForDevtools(devtools, CHROME_START_TIMEOUT);
    return { ok: true, browserWs, stderr: () => stderr, dispose };
  } catch (cause) {
    await dispose();
    return {
      ok: false,
      summary: chromeStartFailureSummary({ args, cause, mode, stderr, stdout }),
    };
  }
}

function chromeArgs(args: { mode: t.Browser.Chrome.Mode; userDataDir: string }) {
  return [
    args.mode.headlessArg,
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${args.userDataDir}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
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
    '--no-zygote',
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

function chromeStartFailureSummary(args: {
  readonly args: readonly string[];
  readonly cause: unknown;
  readonly mode: t.Browser.Chrome.Mode;
  readonly stderr: string;
  readonly stdout: string;
}) {
  const cause = args.cause instanceof Error ? args.cause.message : String(args.cause);
  const stderr = args.stderr ? `stderr:\n${args.stderr}` : 'stderr: <empty>';
  const stdout = args.stdout ? `stdout:\n${args.stdout}` : 'stdout: <empty>';
  return Str.dedent(`
    Attempt: ${args.mode.name}
    Cause: ${cause}
    Args: ${args.args.join(' ')}
    ${stderr}
    ${stdout}
  `).trim();
}
