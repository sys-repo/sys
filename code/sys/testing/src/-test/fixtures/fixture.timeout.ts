import { FixtureDuration } from './u.duration.ts';
import { FixtureMarker } from './u.markers.ts';

await new Promise((resolve) => setTimeout(resolve, FixtureDuration.timeoutStartupDelay));

Deno.test({
  name: 'sanitizer fixture → harness timeout',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.info(FixtureMarker.timeout);
    await new Promise((resolve) => setTimeout(resolve, FixtureDuration.timeoutHold));
  },
});
