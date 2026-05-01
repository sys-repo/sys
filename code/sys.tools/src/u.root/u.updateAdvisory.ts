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

export async function runRootUpdateAdvisory(
  deps: {
    readonly readState?: typeof readUpdateAdvisoryState;
    readonly spawnQuiet?: (specifier: string) => void;
    readonly info?: (...data: unknown[]) => void;
  } = {},
): Promise<UpdateAdvisoryState> {
  let state: UpdateAdvisoryState;
  try {
    state = await prepareRootUpdateAdvisory(deps);
  } catch {
    return emptyUpdateAdvisoryState;
  }

  refreshRootUpdateAdvisoryInBackground(state, deps);

  try {
    if (state.prelude) (deps.info ?? console.info)(state.prelude);
  } catch {
    // Advisory display must never block the selected tool.
  }

  return state;
}

export async function runWithRootUpdateAdvisory<T>(
  fn: () => Promise<T>,
  deps: Parameters<typeof runRootUpdateAdvisory>[0] = {},
): Promise<T> {
  await runRootUpdateAdvisory(deps);
  return await fn();
}

export function refreshRootUpdateAdvisoryInBackground(
  state: UpdateAdvisoryState,
  deps: {
    readonly spawnQuiet?: (specifier: string) => void;
  } = {},
) {
  if (!state.path || !state.stale) return;
  const spawnQuiet = deps.spawnQuiet ?? wrangle.spawnQuiet;
  try {
    spawnQuiet(new URL('../cli.update/u.advisory.probe.entry.ts', import.meta.url).href);
  } catch {
    // Advisory refresh is best-effort and must never block the selected tool.
  }
}

const emptyUpdateAdvisoryState: UpdateAdvisoryState = {
  path: undefined,
  record: undefined,
  stale: false,
  hasUpdate: false,
  prelude: undefined,
};

const wrangle = {
  spawnQuiet(specifier: string) {
    Process.invokeDetached({
      cmd: 'deno',
      args: ['run', '-A', specifier],
      silent: true,
    });
  },
} as const;
