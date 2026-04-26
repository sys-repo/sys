import type { UpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import { readUpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import { Process } from '../common.ts';

export async function prepareRootUpdateAdvisory(
  deps: {
    readonly readState?: typeof readUpdateAdvisoryState;
  } = {},
): Promise<UpdateAdvisoryState> {
  const readState = deps.readState ?? readUpdateAdvisoryState;
  return await readState();
}

export function refreshRootUpdateAdvisoryInBackground(
  state: UpdateAdvisoryState,
  deps: {
    readonly spawnQuiet?: (specifier: string) => void;
  } = {},
) {
  if (!state.path || !state.stale) return;
  const spawnQuiet = deps.spawnQuiet ?? wrangle.spawnQuiet;
  spawnQuiet(new URL('../cli.update/u.advisory.probe.entry.ts', import.meta.url).href);
}

const wrangle = {
  spawnQuiet(specifier: string) {
    Process.invokeDetached({
      cmd: 'deno',
      args: ['run', '-A', specifier],
      silent: true,
    });
  },
} as const;
