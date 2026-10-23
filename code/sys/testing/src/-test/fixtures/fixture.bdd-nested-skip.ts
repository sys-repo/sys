import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

describe('BDD fixture → nested skip propagation', () => {
  it.skip('stays ignored', () => {
    console.info(BddMarker.skippedBody);
  });
  it('runs a later sibling', () => {
    console.info(BddMarker.skippedLater);
  });
});
