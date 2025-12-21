import { type t, c, Cli } from '../common.ts';

type A = t.DeployTool.Endpoint.Menu.Action;

/**
 * Prompt for the next action in the endpoint menu.
 * Keeps the option-list rules centralized.
 */
export async function promptEndpointAction(args: {
  readonly checkOk: boolean;
  readonly ranOk: boolean;
}): Promise<A> {
  const { checkOk, ranOk } = args;

  const dim = (s: string) => c.gray(c.dim(s));

  const answer = await Cli.Input.Select.prompt<A>({
    message: `Actions:`,
    options: [
      ...(checkOk
        ? [{ name: ranOk ? c.gray('  run ✔') : c.green('  run'), value: 'run' as const }]
        : []),
      ...(checkOk ? [] : [{ name: c.yellow('  fix errors'), value: 'fix' as const }]),
      { name: '  edit yaml', value: 'edit' as const },
      { name: '  rename', value: 'rename' },
      { name: ' (delete)', value: 'delete' },
      { name: dim(`${c.cyan('←')} back`), value: 'back' },
    ],
    hideDefault: true,
  });

  return answer as A;
}
