import { afterAll, afterEach, beforeEach, describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

describe('BDD fixture → before-hook failure teardown', () => {
  beforeEach(() => {
    throw new Error('SYS:BDD:before-hook-failure');
  });
  afterEach(() => console.info(BddMarker.beforeFailureAfterEach));
  afterAll(() => console.info(BddMarker.beforeFailureAfterAll));
  it('fails before its body', () => console.info(BddMarker.beforeFailureBody));
});
