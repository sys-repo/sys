import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, c, Cli, D, Is, Str, Time } from '../common.ts';
import { buildDocumentDAG } from './mod.ts';
import { Fmt } from './u.fmt.ts';
import { loadDocumentHook } from './u.hook.ts';

export async function dagHookCommand(cwd: t.StringDir, root: t.Crdt.Id, yamlPath: t.ObjectPath) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  try {
    /**
     * Calculate DAG:
     */
    const startedAt = Time.now.timestamp;
    const spinner = Cli.spinner(Fmt.spinnerText('walking graph...'));
    const dag = await buildDocumentDAG(cmd, root, yamlPath);
    spinner.stop();

    /**
     * Run hook:
     */
    const hookModule = await loadDocumentHook(cwd);
    if (Is.func(hookModule?.onDag)) {
      await hookModule.onDag({ cmd, root, path: { yaml: yamlPath }, dag, startedAt });
    } else {
      const str = Str.builder()
        .line()
        .line(c.yellow(c.italic(`  No ${c.white('onDag(e)')} hook ƒunction available`)))
        .line(c.gray(c.italic(`  Ensure you have generated a ${c.white('hook.ts')} file`)))
        .line();
      console.info(String(str));
    }
  } finally {
    cmd.dispose?.(); // Release network resources.
  }
}
