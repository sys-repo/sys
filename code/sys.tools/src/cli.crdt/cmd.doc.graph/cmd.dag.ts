import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, c, Cli, Is, Str, Time } from '../common.ts';
import { CrdtReposFs } from '../u.config.repo/u.fs.ts';
import { buildDocumentDAG } from './mod.ts';
import { Fmt } from './u.fmt.ts';
import { loadDocumentHook } from './u.hook.ts';

export async function dagHookCommand(cwd: t.StringDir, root: t.Crdt.Id, yamlPath: t.ObjectPath) {
  const ports = await CrdtReposFs.loadPorts(cwd);
  const port = ports.repo;
  const cmd = await RepoProcess.tryClient(port);
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
      const yi = (s: string) => c.yellow(c.italic(s));
      const yid = (s: string) => c.dim(yi(s));
      const gi = (s: string) => c.gray(c.italic(s));

      const str = Str.builder()
        .line()
        .line(yi(`  No hook ƒunction available`))
        .line(gi(`  Create a ${c.white('hook.ts')} file exporting a DAG hook:`))
        .line()
        .line(yid(`    import type { t } from 'jsr:@sys/tools';`))
        .line(yid(`    export const onDag: t.DocumentGraphDagHook = async (e) => { ... }`))
        .line();
      console.info(String(str));
    }
  } finally {
    cmd.dispose?.(); // Release network resources.
  }
}
