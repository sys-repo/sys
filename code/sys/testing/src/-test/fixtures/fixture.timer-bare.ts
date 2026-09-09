import { FixtureDuration } from './u.duration.ts';
import { FixtureMarker } from './u.markers.ts';

Deno.test('sanitizer fixture → bare direct timer', () => {
  const timer = setTimeout(() => undefined, FixtureDuration.timerLeak);
  console.info(`${FixtureMarker.timerBare}:${timer}`);
});
