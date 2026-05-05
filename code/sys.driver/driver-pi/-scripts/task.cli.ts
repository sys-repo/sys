import { main } from '@sys/driver-pi/cli';
import { TaskCli } from './task.cli.u.ts';

await main(await TaskCli.input(Deno.args));
