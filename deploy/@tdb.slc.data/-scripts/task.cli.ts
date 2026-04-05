import { SlcDataCli } from '@tdb/slc-data/cli';

const result = await SlcDataCli.run({ cwd: Deno.cwd(), argv: Deno.args });
if (result.kind === 'help') {
  console.info(result.text);
  console.info();
} else {
  console.info(result);
  console.info();
}
