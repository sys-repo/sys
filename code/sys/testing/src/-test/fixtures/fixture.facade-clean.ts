import { describe, it } from '@sys/testing';
import { FixtureMarker } from './u.markers.ts';

describe('sanitizer fixture → clean facade lifecycle', () => {
  it('closes owned lifecycle', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    const file = await Deno.open('./deno.json', { read: true });
    file.close();
    console.info(FixtureMarker.facadeClean);
  });
});
