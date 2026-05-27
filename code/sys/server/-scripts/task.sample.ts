import { DenoTask } from '@sys/driver-deno/runtime';

await DenoTask.Menu.main({
  cwd: '.',
  argv: Deno.args,
  title: '@sys/server samples',
  include: ['sample:*'],
});
