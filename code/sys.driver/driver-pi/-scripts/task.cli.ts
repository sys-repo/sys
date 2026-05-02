import { Cli } from '@sys/driver-pi/cli';
import { TaskCli } from './task.cli.u.ts';

await Cli.main(await TaskCli.input(Deno.args));
