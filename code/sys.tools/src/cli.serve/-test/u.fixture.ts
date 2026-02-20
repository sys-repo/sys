import { type t, Fs } from '../common.ts';

export type FixtureCaptured =
  | { kind: 'text'; status: number; body: string }
  | { kind: 'response'; status: number; body: Uint8Array; headers: Headers };

export type FixtureHonoCtx = Parameters<t.HonoMiddlewareHandler>[0];
export type FixtureHonoNext = Parameters<t.HonoMiddlewareHandler>[1];

/**
 * Test helpers
 */
export const Fixture = {
  async makeTempDir(section = 'serve-route') {
    const dir = await Fs.makeTempDir({ prefix: `sys.tools.serve.${section}.` });
    return dir.absolute;
  },

  async writeFile(dir: string, rel: string, data: string) {
    await Fs.write(`${dir}/${rel}`, data);
  },

  makeCtx(path: string, captured: { current?: FixtureCaptured }) {
    const url = new URL(`http://localhost${path}`);

    const req = {
      url: url.toString(),
      path: url.pathname,
      query(name?: string) {
        if (!name) {
          const all: Record<string, string> = {};
          url.searchParams.forEach((value, key) => (all[key] = value));
          return all;
        }
        const value = url.searchParams.get(name);
        return value === null ? undefined : value;
      },
    };

    const text = async (body: string, status = 200) => {
      captured.current = { kind: 'text', status, body };
      return new Response(body, { status });
    };

    const newResponse = (body: BodyInit, init?: ResponseInit) => {
      const status = init?.status ?? 200;
      const headers = new Headers(init?.headers);
      const bytes = body instanceof Uint8Array ? body : new TextEncoder().encode(String(body));
      captured.current = { kind: 'response', status, body: bytes, headers };
      return new Response(body, init);
    };

    // Only the bits route() actually uses.
    const ctx = { req, text, newResponse };
    return ctx as unknown as FixtureHonoCtx;
  },

  makeNext() {
    const next: FixtureHonoNext = async () => {};
    return next;
  },
} as const;
