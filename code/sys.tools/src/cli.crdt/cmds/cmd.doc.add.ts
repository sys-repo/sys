import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, D } from '../common.ts';
import { promptAddDocument } from '../u.prompt.modify.ts';

type Result = {
  readonly id: t.Crdt.Id;
  readonly name: string;
  readonly created: boolean;
};

/**
 * Prompt for a document id, optionally creating one via the repo daemon.
 *
 * Returns the chosen/created document id, or <undefined> if the prompt
 * was cancelled / no-op.
 */
export async function addOrCreateDocument(
  cwd: t.StringDir,
  port: number = D.port.repo,
): Promise<Result | undefined> {
  return await promptAddDocument(cwd, {
    async createDoc() {
      const cmd = await RepoProcess.tryClient(port);
      if (!cmd) return undefined;

      try {
        const res = await cmd.send('doc:create', {});
        return res.doc;
      } catch {
        // Caller decides how to surface this (restart daemon, etc).
        return undefined;
      } finally {
        cmd.dispose();
      }
    },
  });
}
