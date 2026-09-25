import { Fs } from './common.ts';
import { main } from './u.runtime.ts';

if (Deno.env.has('SYS_DRIVER_PI_PREVIEW_AMBIENT_SENTINEL')) {
  throw new Error('start:gui:preview worker environment unsanitized.');
}
const denoDir = Deno.env.get('DENO_DIR');
if (!denoDir || !Fs.Path.Is.absolute(denoDir)) {
  throw new Error('start:gui:preview worker Deno cache authority unavailable.');
}
if (Deno.args.length === 0) await main();
else if (Deno.args.length !== 1 || Deno.args[0] !== '--environment-preflight') {
  throw new Error('start:gui:preview worker arguments invalid.');
}
