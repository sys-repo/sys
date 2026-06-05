import { WorkspaceCli } from '@sys/workspace/cli';

await WorkspaceCli.run({ argv: ['upgrade', ...Deno.args] });
