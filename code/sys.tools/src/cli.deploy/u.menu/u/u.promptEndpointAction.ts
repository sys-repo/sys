import { type t, c, Cli } from './common.ts';

type A = t.DeployTool.Endpoint.Menu.Action;

/**
 * Prompt for the next action in the endpoint menu.
 * Keeps the option-list rules centralized.
 */
export async function promptEndpointAction(args: {
  checkOk: boolean;
  ranOk: boolean;
  canPush: boolean;
  pushedOk: boolean;
}): Promise<A> {
  const { checkOk, ranOk, canPush, pushedOk } = args;
  const dim = (s: string) => c.gray(c.dim(s));

  const answer = await Cli.Input.Select.prompt<A>({
    message: `Actions:`,
    options: [
      ...(checkOk
        ? [{ name: ranOk ? '  staged ✔' : '  stage (build, copy)', value: 'stage' as const }]
        : []),
      ...(canPush ? [{ name: pushedOk ? '  push ✔' : '  push', value: 'push' as const }] : []),
      ...(checkOk ? [] : [{ name: c.yellow('  fix errors'), value: 'fix' as const }]),
      { name: '  edit yaml', value: 'edit' as const },
      { name: '  rename', value: 'rename' },
      { name: c.dim(c.gray(' (delete)')), value: 'delete' },
      { name: `${c.cyan('←')} back`, value: 'back' },
    ],
    hideDefault: true,
  });

  return answer as A;
}
