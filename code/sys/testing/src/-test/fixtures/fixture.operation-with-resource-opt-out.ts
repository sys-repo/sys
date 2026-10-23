import { FixtureMarker } from './u.markers.ts';

const listener = Deno.listen({ hostname: '127.0.0.1', port: 0, transport: 'tcp' });
Deno.test.afterAll(() => listener.close());
let pending: Promise<Deno.Conn | undefined> | undefined;

Deno.test({
  name: 'sanitizer fixture → operation leak with resource opt-out',
  sanitizeOps: true,
  sanitizeResources: false,
  fn() {
    pending = listener.accept().catch(() => undefined);
    console.info(
      `${FixtureMarker.operationWithResourceOptOut}:${listener.addr.port}:${Boolean(pending)}`,
    );
  },
});
