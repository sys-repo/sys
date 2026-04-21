import { Workspace } from '@sys/workspace';

export async function main() {
  const result = await Workspace.Run.test({ filter: (e) => true });
  console.info();
  console.info(Workspace.Run.Fmt.result(result));
  console.info();
}
