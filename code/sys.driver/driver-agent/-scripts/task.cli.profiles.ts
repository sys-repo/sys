import { Profiles } from '@sys/driver-agent/pi/cli';
import { TaskCli } from './task.cli.u.ts';

await Profiles.main(await TaskCli.input(Deno.args));
