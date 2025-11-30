import { RepoProcess } from '../cmd.repo.daemon/mod.ts';

import { type t, Cli, Crdt, D, Str, Time } from '../common.ts';
import { makeDiscoverRefs } from './u.discoverRefs.ts';
import { Fmt } from './u.fmt.ts';
import { loadDocumentHook } from './u.hook.ts';
import { makeLoad } from './u.load.ts';

type O = Record<string, unknown>;
type CmdClient = t.Crdt.Cmd.Client;

export async function walkDocumentGraph(
  cwd: t.StringDir,
  root: t.Crdt.Id,
  path: t.ObjectPath,
  onDoc?: t.DocumentGraphHook,
) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const spinner = Cli.spinner();
  const skipped: t.Crdt.Graph.WalkSkipArgs[] = [];
  const processed: t.Crdt.Id[] = [];

  const hookLog: t.DocumentGraphHookLog[] = [];
  const hookModule = await loadDocumentHook(cwd);
  const hooks: t.DocumentGraphHook[] = [];
  if (onDoc) hooks.push(onDoc);
  if (hookModule?.onDoc) hooks.push(hookModule.onDoc);

  const load = makeLoad(cmd);
  const discoverRefs = makeDiscoverRefs(path);

  /**
   * Process (walk the graph)
   */
  async function walk(cmd: CmdClient) {
    const onDoc = async (e: t.Crdt.Graph.WalkDocArgs) => {
      if (hooks.length === 0) return;
      const { id, depth } = e;

      for (const hook of hooks) {
        const log = Str.builder();
        hookLog.push({ id, depth, log });
        await hook({
          cmd,
          root,
          id,
          doc: e.doc,
          depth,
          is: { root: id === root },
          log: (...msg) => log.line(String(msg.join(' '))),
        });
      }
    };

    await Crdt.Graph.walk<O>({
      id: root,
      processed,
      load,
      discoverRefs,
      onDoc,
      onSkip: (e) => skipped.push(e),
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

    const d = await Crdt.Graph.dag<O>({
      id: root,
      load,
      discoverRefs,
    });
    console.log('d', d);

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
