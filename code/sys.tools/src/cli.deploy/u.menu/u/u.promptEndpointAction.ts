import { type t, c, Cli } from './common.ts';

type A = t.DeployTool.Endpoint.Menu.Action;

/**
 * Prompt for the next action in the endpoint menu.
 * Keeps the option-list rules centralized.
 */
export async function promptEndpointAction(args: {
  checkOk: boolean;
  ranOk: boolean;
  showPush: boolean;
  pushedOk: boolean;
  hashPrefix: string;
}): Promise<A> {
  const { checkOk, ranOk, showPush, pushedOk, hashPrefix } = args;
  const stageName = ranOk
    ? `  ${hashPrefix}  staged ✔`
    : `  ${hashPrefix}  stage (prepare bundle)`;
  const pushName = pushedOk ? `  ${hashPrefix}  push ✔` : `  ${hashPrefix}  push`;
  const answer = await Cli.Input.Select.prompt<A>({
    message: `Actions:`,
    options: [
      ...(checkOk ? [{ name: stageName, value: 'stage' as const }] : []),
      ...(showPush ? [{ name: pushName, value: 'push' as const }] : []),
      ...(checkOk ? [] : [{ name: c.yellow('  fix errors'), value: 'fix' as const }]),
      { name: '  config: edit', value: 'edit' as const },
      { name: '  config: rename', value: 'rename' },
      { name: c.dim(c.gray(' (delete)')), value: 'delete' },
      { name: `${c.cyan('←')} back`, value: 'back' },
    ],
    hideDefault: true,
  });

  return answer as A;
}
