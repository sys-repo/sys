import { afterAll, afterEach, describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

describe('BDD fixture → nested failure propagation', () => {
  afterEach(() => console.info(`${BddMarker.nestedFailure}:afterEach`));
  afterAll(() => console.info(`${BddMarker.nestedFailure}:afterAll`));

  it('fails', () => {
    throw new Error(BddMarker.nestedFailure);
  });
  it('continues with a later sibling', () => {
    console.info(BddMarker.nestedFailureLater);
  });
});
