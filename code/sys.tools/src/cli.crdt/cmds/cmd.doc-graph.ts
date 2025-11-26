import { type t, c, Cli, Cmd, Crdt, D } from '../common.ts';
import { RepoProcess } from '../u.repo/mod.ts';
import { Fmt } from '../u.fmt.ts';

type Todo = { todo: string; comment?: string };

export async function traverseDocumentGraph(dir: t.StringDir, root: t.Crdt.Id) {
  const port = D.port;

  const cmd = await RepoProcess.tryClient(D.port);
  if (!cmd) return;


  const processed: t.Crdt.Id[] = [];

  try {
    await Crdt.Graph.walk({
      id: root,
      processed,
      load: async (id) => {
        const { doc } = await cmd.send('doc:get', { doc: id });
        return doc ?? undefined;
      },

      async onDoc(e) {
        console.log('onDoc', e);
      },

      onSkip(e) {
        console.log('skip', e);
      },

      onRefs(e) {
        console.log('onRefs', e);
      },
    });

    console.log('processed', processed);
  } finally {
    // Important: matches whatever you’re doing in `snapshot(...)`
    cmd.dispose?.();
  }

  console.log('🐷 processed', processed);

  return;
}
