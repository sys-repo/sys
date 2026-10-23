import { describe, it } from '@sys/testing';
import { FixtureMarker } from './u.markers.ts';

describe('sanitizer fixture → facade exit interception', () => {
  it('attempts exit zero', () => {
    console.info(FixtureMarker.facadeExit);
    Deno.exit(0);
  });
});
