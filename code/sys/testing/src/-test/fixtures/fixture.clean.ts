import { FixtureMarker } from './u.markers.ts';

Deno.test({
  name: 'sanitizer fixture → clean lifecycle',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn() {
    await new Promise((resolve) => setTimeout(resolve, 1));

    const file = await Deno.open('./deno.json', { read: true });
    file.close();

    const output = await new Deno.Command(Deno.execPath(), {
      args: ['eval', ''],
      stdin: 'null',
      stdout: 'null',
      stderr: 'null',
    }).output();
    if (!output.success) throw new Error(`Clean child failed with exit code ${output.code}.`);

    console.info(FixtureMarker.clean);
  },
});
