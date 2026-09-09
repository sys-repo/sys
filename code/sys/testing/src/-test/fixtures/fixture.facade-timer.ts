import { describe, it } from '@sys/testing';
import { FixtureDuration } from './u.duration.ts';
import { FixtureMarker } from './u.markers.ts';

describe('sanitizer fixture → facade timer leak', () => {
  it('retains a timer', () => {
    const timer = setTimeout(() => undefined, FixtureDuration.timerLeak);
    console.info(`${FixtureMarker.facadeTimer}:${timer}`);
  });
});
