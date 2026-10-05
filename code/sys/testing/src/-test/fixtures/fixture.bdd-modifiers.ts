import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

const ignoredFocusedSuite = describe.skip('ignored suite overrides contradictory focus', {
  only: true,
});
it.only(ignoredFocusedSuite, 'focused child remains ignored', () => {
  console.info(BddMarker.ignoredFocusBody);
});

describe('BDD fixture → modifier suppression', () => {
  describe.todo('body-less todo suite');
  describe.skip('ignored suite with unsupported policy', {
    permissions: 'none',
    timeout: 1,
  });
  it.todo('body-less todo test');
  it.skip('body-less skipped test');
  it.skip('ignored test with unsupported policy', { permissions: 'none', timeout: 1 });
  it.ignore('ignored body', () => console.info(BddMarker.modifierBody));
  it('runs the control', () => console.info(BddMarker.modifierControl));
});
