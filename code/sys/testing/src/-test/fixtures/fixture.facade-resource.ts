import { describe, it } from '@sys/testing';
import { FixtureMarker } from './u.markers.ts';

let retained: Deno.FsFile | undefined;

describe('sanitizer fixture → facade resource leak', () => {
  it('retains a file', async () => {
    retained = await Deno.open('./deno.json', { read: true });
    console.info(`${FixtureMarker.facadeResource}:${retained.statSync().isFile}`);
  });
});
