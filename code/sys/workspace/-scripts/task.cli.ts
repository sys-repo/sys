import { Cli } from '@sys/cli';
import { c } from '@sys/color/ansi';
import { Fs } from '@sys/fs';
import { Str } from '@sys/std/str';
import { createCliSandbox } from './task.cli.fixture.ts';

const sandbox = await createCliSandbox(Deno.args);
const { cwd, argv } = sandbox;

const intro = `
${c.bold(c.brightCyan('CLI:  @sys/workspace sandbox'))}
cwd:  ${c.white(cwd)}
argv: ${c.white(argv.join(' ') || '(interactive defaults)')}
`;
console.info(Str.dedent(c.gray(intro)));

const result = await sandbox.run();
const deps = await Fs.readText(Fs.join(cwd, 'deps.yaml'));
const deno = await Fs.readText(Fs.join(cwd, 'deno.json'));

console.info();
console.info(Cli.Fmt.hr('gray'));
console.info(c.gray(`result: ${result.kind}`));
console.info(c.gray(`sandbox: ${cwd}`));
console.info();
console.info(c.cyan('deps.yaml'));
console.info(deps.data ?? '');
console.info();
console.info(c.cyan('deno.json'));
console.info(deno.data ?? '');
