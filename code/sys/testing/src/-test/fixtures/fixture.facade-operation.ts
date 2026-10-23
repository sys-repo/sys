import { describe, it } from '@sys/testing';
import { FixtureMarker } from './u.markers.ts';

let retained: Deno.ChildProcess | undefined;

describe('sanitizer fixture → facade operation leak', () => {
  it('retains an unawaited child status', () => {
    retained = new Deno.Command(Deno.execPath(), {
      args: ['eval', 'await Deno.stdin.readable.pipeTo(new WritableStream())'],
      stdin: 'piped',
      stdout: 'null',
      stderr: 'null',
    }).spawn();
    console.info(`${FixtureMarker.facadeOperation}:${retained.pid}`);
  });
});
