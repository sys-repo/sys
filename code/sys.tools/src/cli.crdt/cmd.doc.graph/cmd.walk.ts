import { RepoProcess } from '../cmd.repo.daemon/mod.ts';

import { type t, Cli, Crdt, D, Str, Time } from '../common.ts';
import { makeDiscoverRefs } from './u.discoverRefs.ts';
import { Fmt } from './u.fmt.ts';
import { loadDocumentHook } from './u.hook.ts';
import { makeLoad } from './u.load.ts';

type O = Record<string, unknown>;
type CmdClient = t.Crdt.Cmd.Client;

export async function walkDocumentGraphCommand(
  cwd: t.StringDir,
  root: t.Crdt.Id,
  path: t.ObjectPath,
  onWalk?: t.DocumentGraphWalkHook,
) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const skipped: t.Crdt.Graph.WalkSkipArgs[] = [];
  const processed: t.Crdt.Id[] = [];

  /** Prepare hook */
  const hookLog: t.DocumentGraphHookLog[] = [];
  const hookModule = await loadDocumentHook(cwd);
  const hooks: t.DocumentGraphWalkHook[] = [];
  if (onWalk) hooks.push(onWalk);
  if (hookModule?.onWalk) hooks.push(hookModule.onWalk);

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
    const spinner = Cli.spinner(Fmt.spinnerText('walking graph...'));
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
