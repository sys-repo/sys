import { exitCode, main } from '@sys/driver-pi/cli';
import { TaskCli } from './task.cli.u.ts';

const input = await TaskCli.input(Deno.args);
const code = exitCode(await main(input));
if (code !== 0) Deno.exitCode = code;
