import { Env, Fs, Str } from './common.ts';

export async function findChrome() {
  for (const path of await chromeCandidates()) {
    if (await Fs.exists(path)) return path;
  }
  return undefined;
}

export async function chromeNotFoundError() {
  const candidates = Str.dedent(`
    ${(await chromeCandidates()).map((path) => `- ${path}`).join(String.fromCharCode(10))}
  `).trim();
  return new Error(Str.dedent(`
    Browser.load: Chrome executable not found.

    Attempted browser: Chrome
    Lookup order:
      1. options.executablePath
      2. CHROME_BIN
      ${candidates}

    Fix: install Chrome/Chromium or set CHROME_BIN to the browser executable.
    Note: \`deno task test\` runs the Browser.load integration proof for @sys/testing.
  `).trim());
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
