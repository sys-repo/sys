import { type t, Yaml, Obj, c, Cli, Cmd, Crdt, D, Time } from './common.ts';
import { RepoProcess } from './cmd.repo.daemon/mod.ts';
import { Fmt } from './u.fmt.ts';

import { AliasResolver } from '@sys/std/alias';

type O = Record<string, unknown>;
type Client = t.Crdt.Cmd.Client;

export async function tmp(dir: t.StringDir, root: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  console.log('cmd', cmd);
  if (!cmd) return;

  // const spinner = Cli.spinner();
  const skipped: t.Crdt.Graph.WalkSkipArgs[] = [];
  const processed: t.Crdt.Id[] = [];

  function process(doc: t.Crdt.Ref) {
    const yaml = Obj.Path.get<string>(doc.current, ['slug']);
    const obj = Yaml.parse<O>(yaml).data ?? {};
    const resolver = AliasResolver.make(obj, { alias: ['alias'] });

    console.log();
    console.info(Fmt.prettyUri(doc.id));
    console.log('resolver.alias', resolver.alias);
  }

  /**
   * Process (walk the graph)
   */
  async function walk(cmd: Client) {
    await Crdt.Graph.walk({
      id: root,
      processed,
      async load(id) {
        const { doc } = await cmd.send('doc:current', { doc: id });
        return doc ?? undefined;
      },
      async onDoc(e) {
        process(e.doc);
      },
      onSkip: (e) => skipped.push(e),
      onRefs(e) {},
    });
  }

  try {
    const startedAt = Time.now.timestamp;
    // spinner.start(Fmt.spinnerText('walking graph...'));
    await walk(cmd);
    // spinner.stop();
    // await print(cmd, startedAt);
  } finally {
    cmd.dispose?.(); // Release network resources.
  }
}
