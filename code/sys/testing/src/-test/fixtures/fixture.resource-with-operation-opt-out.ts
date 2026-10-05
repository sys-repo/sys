import { FixtureMarker } from './u.markers.ts';

let retained: Deno.FsFile | undefined;

Deno.test({
  name: 'sanitizer fixture → resource leak with operation opt-out',
  sanitizeOps: false,
  sanitizeResources: true,
  async fn() {
    retained = await Deno.open('./deno.json', { read: true });
    console.info(`${FixtureMarker.resourceWithOperationOptOut}:${retained.statSync().isFile}`);
  },
});
