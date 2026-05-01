import { Cli } from '@sys/driver-pi/pi/cli';
import { TaskCli } from './task.cli.u.ts';

await Cli.main(await TaskCli.input(Deno.args));
