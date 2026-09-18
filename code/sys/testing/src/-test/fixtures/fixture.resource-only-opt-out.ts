import { FixtureMarker } from './u.markers.ts';

let retained: Deno.FsFile | undefined;

Deno.test({
  name: 'sanitizer fixture → resource-only opt-out',
  sanitizeOps: true,
  sanitizeResources: false,
  async fn() {
    retained = await Deno.open('./deno.json', { read: true });
    console.info(`${FixtureMarker.resourceOptOut}:${retained.statSync().isFile}`);
  },
});
