import { Workspace } from '@sys/workspace';

export async function main() {
  const result = await Workspace.Run.test();
  console.info();
  console.info(Workspace.Run.Fmt.result(result));
  console.info();
}

if (import.meta.main) await main();
