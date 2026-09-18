import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

describe(
  'BDD fixture → top-level timeout forwarding',
  { timeout: 50, sanitizeOps: false, sanitizeResources: false },
  () => {
    it('times out through Deno', async () => {
      console.info(BddMarker.topTimeout);
      await new Promise((resolve) => setTimeout(resolve, 60_000));
    });
  },
);
