import { Workspace } from '@sys/workspace';
import { CompletionHang } from '@sys/workspace/run';

export async function main() {
  const result = await Workspace.Run.check();
  console.info();
  console.info(Workspace.Run.Fmt.result(result));
  console.info();
  CompletionHang.armWarning({ result });
}

if (import.meta.main) await main();
