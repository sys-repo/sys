import { FixtureDuration } from './u.duration.ts';
import { FixtureMarker } from './u.markers.ts';

Deno.test({
  name: 'sanitizer fixture → explicit unsanitized timer',
  sanitizeOps: false,
  sanitizeResources: false,
  fn() {
    const timer = setTimeout(() => undefined, FixtureDuration.timerLeak);
    console.info(`${FixtureMarker.explicitUnsanitized}:${timer}`);
  },
});
