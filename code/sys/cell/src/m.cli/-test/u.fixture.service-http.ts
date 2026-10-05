import { HttpServer } from '@sys/http/server';
import type { HttpServer as THttpServer } from '@sys/http/t';
import { Cli, type t } from '../common.ts';

/** A real HTTP-owned endpoint loaded through an ordinary Cell descriptor. No provider bootstrap. */
export const HttpOwner: t.Cell.Services.LifecycleEndpoint = {
  start(args) {
    const app = HttpServer.create();
    app.get('/', (ctx) => ctx.text('cell presentation fixture'));
    const server = HttpServer.start(app, {
      hostname: '127.0.0.1',
      port: 0,
      strictPort: true,
      origin: 'exact-loopback',
      keyboard: false,
      silent: args.silent,
      until: args.until,
      name: 'owner-http',
      status: { details: [{ label: 'shell', value: 'plain shell' }] },
      formatDetail(this: unknown, args) {
        HttpFixture.calls.push({ ...args, receiver: this });
        if (HttpFixture.failure !== undefined) throw HttpFixture.failure;
        const narrow = args.maxWidth !== undefined && args.maxWidth < 20;
        const label = narrow ? 'shell' : 'owner shell link';
        return Cli.Fmt.hyperlink(label, new URL(HttpFixture.href));
      },
    });
    const status = server.status;
    server.status = () => {
      HttpFixture.reads += 1;
      const snapshot = status();
      HttpFixture.details = snapshot.details ?? [];
      return snapshot;
    };
    HttpFixture.server = server;
    HttpFixture.silent = args.silent;
    return server;
  },
};

export const HttpFixture: {
  readonly href: string;
  server?: THttpServer.Started;
  silent?: boolean;
  failure?: unknown;
  reads: number;
  details: readonly t.Service.Detail[];
  calls: (Parameters<t.Cli.Fmt.Service.FormatDetail>[0] & { receiver: unknown })[];
  reset(): void;
} = {
  href: 'file:///tmp/cell-owner-shell/dist.json',
  reads: 0,
  details: [],
  calls: [],
  reset() {
    this.server = undefined;
    this.silent = undefined;
    this.failure = undefined;
    this.reads = 0;
    this.details = [];
    this.calls = [];
  },
};
