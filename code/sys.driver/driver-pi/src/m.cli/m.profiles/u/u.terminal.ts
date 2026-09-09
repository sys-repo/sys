import { Cli } from '../common.ts';

export function clearInteractiveScreen(isTerminal = Cli.Is.terminal) {
  if (isTerminal('stdout')) console.clear();
}
