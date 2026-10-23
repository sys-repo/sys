import { FixtureMarker } from './u.markers.ts';

let retained: Deno.ChildProcess | undefined;

Deno.test({
  name: 'sanitizer fixture → strict child-operation leak',
  sanitizeOps: true,
  sanitizeResources: true,
  fn() {
    retained = new Deno.Command(Deno.execPath(), {
      args: ['eval', 'await Deno.stdin.readable.pipeTo(new WritableStream())'],
      stdin: 'piped',
      stdout: 'null',
      stderr: 'null',
    }).spawn();
    console.info(`${FixtureMarker.operationStrict}:${retained.pid}`);
  },
});
