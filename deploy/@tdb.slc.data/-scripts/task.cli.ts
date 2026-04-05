import { SlcDataCli } from '@tdb/slc-data/cli';

const result = await SlcDataCli.menu(Deno.cwd());
console.info(result);
