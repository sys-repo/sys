import { SlcDataCli } from '@tdb/slc-data/cli';

const cwd = Deno.cwd();
const result = await SlcDataCli.run({ cwd, argv: Deno.args, target: `${cwd}/public/data` });

console.info(result.kind === 'help' ? result.text : result);
console.info();
