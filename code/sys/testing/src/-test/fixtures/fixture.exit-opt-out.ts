import { FixtureMarker } from './u.markers.ts';

Deno.test({
  name: 'sanitizer fixture → exit opt-out',
  sanitizeExit: false,
  fn() {
    console.info(FixtureMarker.exitOptOut);
    Deno.exit(0);
  },
});
