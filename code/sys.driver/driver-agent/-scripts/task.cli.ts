import { Cli } from '@sys/driver-agent/pi/cli';
import { TaskCli } from './task.cli.u.ts';

await Cli.main(await TaskCli.input(Deno.args));
