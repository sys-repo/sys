import { describe, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: Service', () => {
  it('defines renderer-neutral service status snapshots', () => {
    const status = {
      state: 'ready',
      name: 'site',
      kind: 'static',
      root: '/tmp/site' as t.StringDir,
      config: '/tmp/site.yaml' as t.StringPath,
      urls: [{ href: 'http://localhost:8080/' as t.StringUrl, label: 'local' }],
      details: [{ label: 'host', value: '127.0.0.1' }],
    } satisfies t.Service.Status;

    expectTypeOf(status).toMatchTypeOf<t.Service.Status>();
  });

  it('defines status and lifecycle handle surfaces', () => {
    const handle = {
      status: () => ({ state: 'ready' as const }),
      finished: Promise.resolve(),
      close: (_reason?: unknown) => Promise.resolve(),
      dispose: (_reason?: unknown) => undefined,
    } satisfies t.Service.Handle;

    expectTypeOf(handle).toMatchTypeOf<t.Service.Handle>();
    expectTypeOf(handle).toMatchTypeOf<t.Service.StatusHandle>();
    expectTypeOf(handle).toMatchTypeOf<t.Service.LifecycleHandle>();
  });

  it('defines service-owned resource declarations', async () => {
    const resource = {
      kind: 'tcp-listener',
      host: '127.0.0.1',
      port: 5050,
    } satisfies t.Service.Resource.TcpListener;
    const args = {
      cwd: '/tmp/cell' as t.StringDir,
      paths: { config: '/tmp/cell/-config/service.yaml' as t.StringPath },
    } satisfies t.Service.Resource.Args;

    expectTypeOf(resource).toMatchTypeOf<t.Service.Resource.Any>();
    expectTypeOf(args).toMatchTypeOf<t.Service.Resource.Args>();
  });

  it('defines generic lifecycle endpoints', async () => {
    type Args = { readonly until?: t.UntilInput };

    const endpoint: t.Service.LifecycleEndpoint<Args> = {
      resources() {
        return [{ kind: 'tcp-listener', port: 5050 }];
      },
      start(args) {
        expectTypeOf(args).toMatchTypeOf<Args>();
        return { status: () => ({ state: 'ready' }) };
      },
    };

    const resources = await endpoint.resources?.({
      cwd: '/tmp/cell' as t.StringDir,
      paths: { config: '/tmp/cell/-config/service.yaml' as t.StringPath },
    });
    const started = await endpoint.start({});

    expectTypeOf(resources).toMatchTypeOf<readonly t.Service.Resource.Any[] | undefined>();
    expectTypeOf(started).toMatchTypeOf<t.Service.Handle>();
  });
});
