import { expect } from '../../-test.ts';
import { Fs, Json, type t } from '../common.ts';

export type FixtureCaptured =
  | { kind: 'text'; status: number; body: string }
  | { kind: 'json'; status: number; body: unknown };

export type FixtureHonoCtx = Parameters<t.HttpServer.Hono.MiddlewareHandler>[0];
export type FixtureHonoNext = Parameters<t.HttpServer.Hono.MiddlewareHandler>[1];

const DIST_DIGEST = 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18';

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

  distDoc(input: { readonly builtAt: number; readonly totalBytes?: number }): t.DistPkg {
    const { builtAt, totalBytes = 2_100_000 } = input;
    return {
      type: 'https://jsr.io/@sys/types/0.0.281/src/types/t.Pkg.dist.ts',
      pkg: { name: '@sys/example', version: '1.2.3' },
      build: {
        time: builtAt as t.UnixTimestamp,
        size: { total: totalBytes as t.NumberBytes, pkg: 1_500_000 as t.NumberBytes },
        builder: '@sys/tools@0.0.400',
        runtime: 'deno=2.7.14',
        hash: { policy: 'https://jsr.io/@sys/fs/0.0.294/src/m.Pkg/m.Pkg.Dist.ts' },
      },
      hash: {
        digest: DIST_DIGEST,
        parts: {
          './index.html': 'sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      },
    };
  },

  async makeDistServeTarget(input: {
    readonly section: string;
    readonly builtAt: number;
    readonly artifact?: string;
    readonly configText?: string;
    readonly indexHtml?: string;
  }) {
    const cwd = await Fixture.makeTempDir(input.section);
    const artifact = input.artifact ?? 'site';
    const dist = Fixture.distDoc({ builtAt: input.builtAt });
    const configText = input.configText ?? `name: View\ndir: ./${artifact}\n`;

    await Fixture.writeFile(cwd, `${artifact}/index.html`, input.indexHtml ?? '<!doctype html>');
    await Fixture.writeFile(cwd, `${artifact}/dist.json`, `${Json.stringify(dist, '  ')}\n`);
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/view.yaml', configText);

    return { cwd, artifact, dist } as const;
  },

  makeCtx(path: string, captured: { current?: FixtureCaptured }, init?: RequestInit) {
    const url = new URL(`http://localhost${path}`);

    const req = {
      raw: new Request(url, init),
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

    const text = (body: string, status = 200) => {
      captured.current = { kind: 'text', status, body };
      return new Response(body, { status });
    };

    const json = (body: unknown, status = 200) => {
      captured.current = { kind: 'json', status, body };
      return Response.json(body, { status });
    };

    // Only the bits route() actually uses.
    const ctx = { req, text, json };
    return ctx as unknown as FixtureHonoCtx;
  },

  makeNext() {
    const next: FixtureHonoNext = async () => {};
    return next;
  },

  async expectFinishedSoon(finished: Promise<void>): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        finished.then(() => 'finished' as const),
        new Promise<'timeout'>((resolve) => {
          timeout = setTimeout(() => resolve('timeout'), 500);
        }),
      ]);
      expect(result).to.eql('finished');
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  },
} as const;
