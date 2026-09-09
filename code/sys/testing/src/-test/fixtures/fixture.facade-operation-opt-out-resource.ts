import { it } from '@sys/testing';
import { FixtureMarker } from './u.markers.ts';

const listener = Deno.listen({ hostname: '127.0.0.1', port: 0, transport: 'tcp' });
Deno.test.afterAll(() => listener.close());
let pending: Promise<Deno.Conn | undefined> | undefined;
let retained: Deno.FsFile | undefined;

it(
  'sanitizer fixture → facade per-signal isolation',
  { sanitizeOps: false },
  async () => {
    pending = listener.accept().catch(() => undefined);
    retained = await Deno.open('./deno.json', { read: true });
    console.info(
      `${FixtureMarker.facadeOperationOptOutResource}:${retained.statSync().isFile}:${
        Boolean(pending)
      }`,
    );
  },
);
