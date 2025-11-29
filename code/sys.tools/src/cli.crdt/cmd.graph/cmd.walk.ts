import { RepoProcess } from '../cmd.daemon.repo/mod.ts';

import { type t, Cli, Crdt, D, Str, Time } from '../common.ts';
import { Fmt } from './u.fmt.ts';
import { loadDocumentHook } from './u.hook.ts';

type O = Record<string, unknown>;
type Client = t.Crdt.Cmd.Client;

export async function walkDocumentGraph(cwd: t.StringDir, root: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const spinner = Cli.spinner();
  const skipped: t.Crdt.Graph.WalkSkipArgs[] = [];
  const processed: t.Crdt.Id[] = [];

  const hookModule = await loadDocumentHook(cwd);
  const onDocHook = hookModule?.onDoc;
  const hookLog: t.DocumentGraphHookLog[] = [];

  /**
   * Process (walk the graph)
   */
  async function walk(client: Client) {
    /**
     * Command-backed loader:
     */
    const load: t.Crdt.Graph.LoadDoc<O> = async (id) => {
      const result = await client.send('doc:read', { doc: id });
      const current = result.value as O | undefined;
      if (!current) return undefined;
      return {
        get current() {
          return current;
        },
      };
    };

    const onDoc = async (e: t.Crdt.Graph.WalkDocArgs) => {
      if (!onDocHook) return;
      const { id, depth } = e;
      const log = Str.builder();
      hookLog.push({ id, depth, log });
      await onDocHook({
        cmd,
        root,
        id,
        snapshot: e.doc,
        depth,
        log: (...msg) => log.line(String(msg.join(' '))),
      });
    };

    await Crdt.Graph.walk<O>({
      id: root,
      processed,
      load,
      onDoc,
      onSkip: (e) => skipped.push(e),
      onRefs: (e) => {},
      async discoverRefs(e) {
        return Crdt.Graph.default.discoverRefs(e);
      },
    });
  }

  try {
    /**
     * Run:
     */
    const startedAt = Time.now.timestamp;
    spinner.start(Fmt.spinnerText('walking graph...'));
    await walk(cmd);
    spinner.stop();

    /**
     * Print:
     */
    console.info(await Fmt.buildProcessedTable(cmd, processed, startedAt));
    if (skipped.length > 0) console.info(await Fmt.buildNotFoundTable(skipped));
    if (hookLog.length > 0) console.info(Fmt.buildHookOutputTable(hookLog));
    console.info();
  } finally {
    cmd.dispose?.(); // Release network resources.
  }
}
