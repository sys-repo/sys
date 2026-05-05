import type { UpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import {
  readUpdateAdvisoryState,
  toUpdateAdvisoryStateFromRemote,
} from '../cli.update/u.advisory.ts';
import { runUpdateAdvisoryProbe } from '../cli.update/u.advisory.probe.ts';
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
  const probe = deps.probe ?? runUpdateAdvisoryProbe;

  let state = emptyUpdateAdvisoryState;
  try {
    state = await readState();
  } catch {
    // Cache reads are fallback only; they must not suppress a live startup probe.
  }

  // Non-persistent forced advisory state, e.g. the debug remote env, is already authoritative.
  if (!state.path && state.hasUpdate) return state;

  try {
    const result = await probe();
    if (result.ok) return toUpdateAdvisoryStateFromRemote(result.remote, { path: state.path });
    return state;
  } catch {
    return state;
  }
}

export async function runWithRootUpdateAdvisory<T>(
  fn: () => Promise<T>,
  deps: RootUpdateAdvisoryOptions & {
    readonly readState?: typeof readUpdateAdvisoryState;
    readonly probe?: typeof runUpdateAdvisoryProbe;
    readonly info?: (...data: unknown[]) => void;
  } = {},
): Promise<T> {
  try {
    const state = await prepareRootUpdateAdvisory(deps);
    if (state.prelude) (deps.info ?? console.info)(state.prelude);
  } catch {
    // Advisory checks must never block the selected tool.
  }

  return await fn();
}

const emptyUpdateAdvisoryState: UpdateAdvisoryState = {
  path: undefined,
  record: undefined,
  hasUpdate: false,
  prelude: undefined,
};
