import { SlcDataCli } from '@tdb/slc-data/cli';

const cwd = Deno.cwd();
const result = await SlcDataCli.run({ cwd, argv: Deno.args, target: `${cwd}/public/data` });

console.info(SlcDataCli.Fmt.result(result));
console.info();
