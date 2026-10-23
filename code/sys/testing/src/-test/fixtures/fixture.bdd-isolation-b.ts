import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';
import { next } from './u.bdd-isolation.ts';

console.info(BddMarker.ready);

describe('BDD fixture → module isolation B', () => {
  it('observes isolated mutable import state', () => {
    console.info(`${BddMarker.isolation}:B:${next()}`);
  });
});
