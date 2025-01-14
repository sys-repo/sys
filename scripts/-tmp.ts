import { Jsr } from '@sys/std/jsr';
import { Cli } from '@sys/cli';
import { Paths } from './u.paths.ts';

// console.log('Jsr', Jsr);
// const info = await Jsr.Fetch.Pkg.info('@sys/std');
// console.log('info', info);
// console.log(`-------------------------------------------`);
// console.log('moduleGraph1', info.data?.moduleGraph1);
// console.log('moduleGraph2', info.data?.moduleGraph2);

const options = Paths.modules.map((path) => {
  return { name: path, value: path };
});

const res = await Cli.Prompt.Checkbox.prompt({
  message: '(Workflow) JSR Publish Modules:',
  options,
});
console.log('res', res);

/**
 * Finish up.
 */
Deno.exit(0);
