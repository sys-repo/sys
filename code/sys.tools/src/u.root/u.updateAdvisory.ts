import type { UpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import { readUpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import { runUpdateAdvisoryProbe } from '../cli.update/u.advisory.probe.ts';
import { Process } from '../common.ts';
import {
  type RootUpdateAdvisoryOptions,
  RootUpdateAdvisoryPolicy,
} from './u.updateAdvisory.policy.ts';

export async function prepareRootUpdateAdvisory(
  deps: RootUpdateAdvisoryOptions & {
    readonly readState?: typeof readUpdateAdvisoryState;
    readonly probe?: typeof runUpdateAdvisoryProbe;
  } = {},
): Promise<UpdateAdvisoryState> {
  if (RootUpdateAdvisoryPolicy.isDisabled(deps)) return emptyUpdateAdvisoryState;

  const readState = deps.readState ?? readUpdateAdvisoryState;
  const state = await readState();
  if (!state.path || !state.stale) return state;

  try {
    await (deps.probe ?? runUpdateAdvisoryProbe)();
    return await readState();
  } catch {
    return state;
  }
}

export async function runRootUpdateAdvisory(
  deps: {
    readonly readState?: typeof readUpdateAdvisoryState;
    readonly probe?: typeof runUpdateAdvisoryProbe;
    readonly spawnQuiet?: (specifier: string) => void;
    readonly info?: (...data: unknown[]) => void;
  } & RootUpdateAdvisoryOptions = {},
): Promise<UpdateAdvisoryState> {
  if (RootUpdateAdvisoryPolicy.isDisabled(deps)) return emptyUpdateAdvisoryState;

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
  deps: RootUpdateAdvisoryOptions & {
    readonly spawnQuiet?: (specifier: string) => void;
  } = {},
) {
  if (RootUpdateAdvisoryPolicy.isDisabled(deps)) return;
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
