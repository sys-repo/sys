import { SlugDataCli } from '@tdb/data/slug/cli';

const cwd = Deno.cwd();
const result = await SlugDataCli.run({ cwd, argv: Deno.args, target: `${cwd}/public/data` });

console.info(SlugDataCli.Fmt.result(result));
console.info();
