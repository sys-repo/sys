import { Fs } from '@sys/fs';
import { type t, SlugDataCli as Cli } from '@tdb/data/slug/cli';

export async function run(args: {
  cwd?: t.StringDir;
  profile?: t.StringId;
  source?: t.StringPath;
} = {}) {
  const cwd = args.cwd ?? Deno.cwd() as t.StringDir;
  const profile = args.profile ?? 'sample-1' as t.StringId;
  const source = args.source ?? './src/-test/sample-1' as t.StringPath;
  const path = Cli.StageProfile.path(cwd, profile);
  const yaml = Cli.StageProfile.schema.stringify({
    mappings: [
      { mount: 'sample-one' as t.StringId, source },
      { mount: 'sample-two' as t.StringId, source },
    ],
  });
  await Fs.write(path, yaml);
  const result = { kind: 'created', path } as const;
  console.info(Cli.Fmt.result(result));
  return result;
}

if (import.meta.main) {
  await run();
}
