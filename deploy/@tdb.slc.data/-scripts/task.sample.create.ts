import { Fs } from '@sys/fs';
import { type t, SlcDataCli as Cli } from '@tdb/slc-data/cli';

const cwd = Deno.cwd() as t.StringDir;
const profile = 'sample-1' as t.StringId;
const source = './src/-test/sample-1' as t.StringPath;
const path = Cli.StageProfile.path(cwd, profile);
const doc = Cli.StageProfile.schema.initial(profile);

const yaml = Cli.StageProfile.schema.stringify({ ...doc, source });
await Fs.write(path, yaml);

console.info({ kind: 'created', path });
