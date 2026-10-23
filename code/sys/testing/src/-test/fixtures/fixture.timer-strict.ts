import { FixtureDuration } from './u.duration.ts';
import { FixtureMarker } from './u.markers.ts';

Deno.test({
  name: 'sanitizer fixture → strict timer leak',
  sanitizeOps: true,
  sanitizeResources: true,
  fn() {
    const timer = setTimeout(() => undefined, FixtureDuration.timerLeak);
    console.info(`${FixtureMarker.timerStrict}:${timer}`);
  },
});
