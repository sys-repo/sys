// Cold-import probe: deliberately no test harness or broad script barrel in this process.
import { runFrozenBrowser, runReleaseRuntime } from '../u.test.release.ts';

for (
  const descriptor of [
    { name: 'env', variable: 'TF_BUILD' },
    { name: 'env', variable: 'DENO_DIR' },
    { name: 'read' },
    { name: 'write' },
    { name: 'net' },
    { name: 'ffi' },
  ] satisfies Deno.PermissionDescriptor[]
) {
  if ((await Deno.permissions.query(descriptor)).state === 'granted') {
    throw new Error(`Unexpected launcher authority: ${descriptor.name}`);
  }
}

let calls = 0;
const inherit = () => {
  calls++;
  return Promise.resolve({ code: 19, success: false, signal: null });
};
const runtime = await runReleaseRuntime(inherit);
const browser = await runFrozenBrowser({
  inherit,
  env: {
    get() {
      throw new Error('Failed admission must not read Chrome.');
    },
    delete() {
      throw new Error('Failed admission must not change the environment.');
    },
  },
});
if (runtime !== 19 || browser !== 19 || calls !== 2) {
  throw new Error('Launcher did not preserve child settlement.');
}
console.info('release launcher: cold import and narrow authority verified');
