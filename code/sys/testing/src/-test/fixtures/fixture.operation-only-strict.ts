import { FixtureMarker } from './u.markers.ts';

const listener = Deno.listen({ hostname: '127.0.0.1', port: 0, transport: 'tcp' });
Deno.test.afterAll(() => listener.close());
let pending: Promise<Deno.Conn | undefined> | undefined;

Deno.test({
  name: 'sanitizer fixture → strict operation-only leak',
  sanitizeOps: true,
  sanitizeResources: true,
  fn() {
    pending = listener.accept().catch(() => undefined);
    console.info(`${FixtureMarker.operationOnlyStrict}:${listener.addr.port}:${Boolean(pending)}`);
  },
});
