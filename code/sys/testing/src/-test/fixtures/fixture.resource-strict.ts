import { FixtureMarker } from './u.markers.ts';

let retained: Deno.FsFile | undefined;

Deno.test({
  name: 'sanitizer fixture → strict resource leak',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn() {
    retained = await Deno.open('./deno.json', { read: true });
    console.info(`${FixtureMarker.resourceStrict}:${retained.statSync().isFile}`);
  },
});
