import { type t, Cli, Fs, JsonFile } from '../common.ts';

/**
 * Get or create the `crdt.config.json` file.
 */
export async function getConfig(dir: t.StringDir): Promise<t.CrdtConfig> {
  // Dynamic imports to prevert circular refs.
  const { D } = (await import('./common.ts')) satisfies typeof import('./common.ts');
  const { Fmt } = (await import('./u.fmt.ts')) satisfies typeof import('./u.fmt.ts');

  /**
   * Check pre-reqs:
   */
  const path = Fs.join(dir, D.Config.filename);
  if (!(await Fs.exists(path))) {
    console.info(Fmt.Prereqs.folderNotConfigured(dir, D.toolname));
    const yes = await Cli.Prompt.Confirm.prompt({ message: `Create config file now?` });
    if (!yes) Deno.exit(0);
  }

  /**
   * Get or create the config-file.
   */
  const doc = JsonFile.Singleton.get<t.CrdtConfigDoc>(path, D.Config.doc, { touch: true });
  return doc;
}
