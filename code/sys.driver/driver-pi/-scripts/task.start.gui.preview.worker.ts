import { main } from './task.start.gui.preview.u.ts';

if (Deno.env.has('SYS_DRIVER_PI_PREVIEW_AMBIENT_SENTINEL')) {
  throw new Error('start:gui:preview worker environment unsanitized.');
}
if (Deno.args.length === 0) await main();
else if (Deno.args.length !== 1 || Deno.args[0] !== '--environment-preflight') {
  throw new Error('start:gui:preview worker arguments invalid.');
}
