import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);
console.info(BddMarker.nestedPermission);

describe('BDD fixture → nested permission rejection', () => {
  it('rejects unsupported permission policy', { permissions: 'none' }, () => {
    console.info(BddMarker.nestedPermissionBody);
  });
});
