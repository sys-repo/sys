import { test } from 'node:test';
import { FixtureDuration } from './u.duration.ts';
import { FixtureMarker } from './u.markers.ts';

test('sanitizer fixture → node-compatible timer', () => {
  const timer = setTimeout(() => undefined, FixtureDuration.timerLeak);
  console.info(`${FixtureMarker.nodeTimer}:${timer}`);
});
