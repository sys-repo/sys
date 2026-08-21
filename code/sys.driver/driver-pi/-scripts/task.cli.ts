import { main } from '@sys/driver-pi/cli';
import { TaskCli } from './task.cli.u.ts';

const input = await TaskCli.input(Deno.args);
const exitCode = await TaskCli.settle(() => main(input));
if (exitCode !== 0) Deno.exitCode = exitCode;
