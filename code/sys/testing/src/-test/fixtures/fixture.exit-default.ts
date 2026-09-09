import { FixtureMarker } from './u.markers.ts';

Deno.test('sanitizer fixture → default exit interception', () => {
  console.info(FixtureMarker.exitDefault);
  Deno.exit(0);
});
