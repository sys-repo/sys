import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

describe('BDD fixture → top-level permission forwarding', { permissions: 'none' }, () => {
  it('runs under revoked read permission', async () => {
    let cause: unknown;
    try {
      await Deno.readTextFile('./deno.json');
    } catch (error) {
      cause = error;
    }
    if (!(cause instanceof Deno.errors.NotCapable)) {
      throw new Error('Top-level read permission did not fail with NotCapable.', { cause });
    }
    console.info(`${BddMarker.topPermission}:blocked`);
  });
});
