import { Workspace } from '@sys/workspace';

export async function main() {
  const args = Workspace.Run.Args.test(Deno.args);
  const result = await Workspace.Run.test(args);
  console.info();
  console.info(Workspace.Run.Fmt.result(result));
  console.info();
}

if (import.meta.main) await main();
