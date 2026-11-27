import { Perf } from '../../common/u.perf.ts';
import { Http, Is, Num, stripAnsi, type t, Url } from '../common.ts';

export const REGEX = {
  // VITE v7.1.9-beta.1 ready in 87ms
  STARTED: /\bvite\s+v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\s+ready\s+in\s+\d+\s*ms\b/i,
  DEV_RUNNING: /\bdev\s+server\s+running\s+at\b/i,
  LOCAL_OR_NETWORK: /\b(?:Local|Network):\s+https?:\/\/[^\s/]+(?::\d+)?\/?/i,
  LOCAL_URL: /\bLocal:\s+(https?:\/\/[^\s]+)/i,
  NETWORK_URL: /\bNetwork:\s+(https?:\/\/[^\s]+)/i,
} as const;

export const DevParse = {
  url(line: string, pattern: RegExp) {
    const match = line.match(pattern);
    if (!match) return '';
    const parsed = Url.parse(match[1].trim());
    return parsed.ok ? parsed.href : '';
  },

  port(url: string, fallback: number) {
    const parsed = Url.parse(url);
    if (!parsed.ok) return fallback;

    const value = parsed.toURL().port;
    if (Is.blank(value)) return fallback;

    const port = Number(value);
    if (!Is.num(port)) return fallback;
    return Num.Is.int(port) ? port : fallback;
  },
} as const;

/** Probe one endpoint for HTTP readiness. URL preference: reported Local, reported Network, requested. */
export function createReadiness(
  requestedPort: number,
  strictPort: boolean,
  waitForHttp = Http.Client.waitFor,
) {
  const requestedUrl = `http://localhost:${requestedPort}/`;
  let localUrl = '';
  let networkUrl = '';
  const url = () => localUrl || networkUrl || requestedUrl;
  const readySignal: t.Process.ReadySignalFilter = (event) => {
    let ready = false;
    for (const text of stripAnsi(event.toString()).split('\n')) {
      const line = text.trim();
      localUrl = DevParse.url(line, REGEX.LOCAL_URL) || localUrl;
      networkUrl = DevParse.url(line, REGEX.NETWORK_URL) || networkUrl;
      if (
        REGEX.STARTED.test(line) || REGEX.DEV_RUNNING.test(line) ||
        REGEX.LOCAL_OR_NETWORK.test(line)
      ) {
        ready = true;
      }
    }
    return ready;
  };

  async function wait(proc: t.Process.Handle, signal: AbortSignal) {
    const end = Perf.section('dev.parent.waitForReady', { requestedUrl }, { level: 2 });
    await proc.whenReady();
    end({ resolvedUrl: url() });
    await Perf.measure(
      'dev.parent.waitForResolvedUrl',
      async () => await waitForHttp(url(), { timeout: 30_000, interval: 150, signal }),
      { resolvedUrl: url() },
      { level: 2 },
    );
    const resolvedUrl = url();
    const port = DevParse.port(resolvedUrl, requestedPort);
    if (strictPort && port !== requestedPort) {
      throw new Error(
        `Vite.dev: strict port mismatch: requested ${requestedPort}, resolved ${port}.`,
      );
    }
    return { port, resolvedUrl };
  }

  return { requestedUrl, url, readySignal, wait };
}
