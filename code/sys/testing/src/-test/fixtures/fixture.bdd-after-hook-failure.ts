import { afterAll, afterEach, describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

describe('BDD fixture → after-hook failure continuation', () => {
  afterEach(() => {
    throw new Error('SYS:BDD:after-hook-failure');
  });
  afterEach(() => console.info(BddMarker.afterFailureSecondHook));
  afterAll(() => console.info(BddMarker.afterFailureAfterAll));
  it('runs its body', () => console.info(BddMarker.afterFailureBody));
});
