import { SlcDataCli } from '@tdb/slc-data/cli';
import { Fmt } from '../src/fs/m.cli/u.fmt.ts';

const cwd = Deno.cwd();
const result = await SlcDataCli.run({ cwd, argv: Deno.args, target: `${cwd}/public/data` });

console.info(
  result.kind === 'help'
    ? result.text
    : result.kind === 'refresh-root'
      ? Fmt.refreshRoot(result)
      : result.kind === 'staged'
        ? Fmt.staged(result)
        : result,
);
console.info();
