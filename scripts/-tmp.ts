import { Cli } from '@sys/cli';
import { Paths } from './u.paths.ts';

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
