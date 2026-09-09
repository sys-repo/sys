import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);
console.info(BddMarker.nestedTimeout);

describe('BDD fixture → nested timeout rejection', () => {
  it('rejects unsupported timeout policy', { timeout: 10 }, () => {
    console.info(BddMarker.nestedTimeoutBody);
  });
});
