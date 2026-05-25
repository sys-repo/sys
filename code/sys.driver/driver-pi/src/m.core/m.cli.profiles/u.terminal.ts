import { Cli } from './common.ts';

export function clearInteractiveScreen() {
  if (Cli.Is.terminal('stdout')) console.clear();
}
