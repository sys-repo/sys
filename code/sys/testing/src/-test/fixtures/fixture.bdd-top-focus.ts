import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

describe('BDD fixture → unfocused top-level suite', () => {
  it('does not run', () => console.info(BddMarker.topFocusSibling));
});

describe.only('BDD fixture → focused top-level suite', () => {
  it('runs', () => console.info(BddMarker.topFocus));
});
