import { Fs } from '@sys/fs';
import { type t, SlcDataCli as Cli } from '@tdb/slc-data/cli';

export async function run(args: {
  cwd?: t.StringDir;
  profile?: t.StringId;
  source?: t.StringPath;
} = {}) {
  const cwd = args.cwd ?? Deno.cwd() as t.StringDir;
  const profile = args.profile ?? 'sample-1' as t.StringId;
  const source = args.source ?? './src/-test/sample-1' as t.StringPath;
  const path = Cli.StageProfile.path(cwd, profile);
  const doc = Cli.StageProfile.schema.initial(profile);

  const yaml = Cli.StageProfile.schema.stringify({ ...doc, source });
  await Fs.write(path, yaml);
  const result = { kind: 'created' as const, path };
  console.info(result);
  return result;
}

if (import.meta.main) {
  await run();
}
