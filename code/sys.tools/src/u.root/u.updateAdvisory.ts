import type { UpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import { readUpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import { runUpdateAdvisoryProbe } from '../cli.update/u.advisory.probe.ts';
import { Path, pkg, Process } from './common.ts';
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

  let state = emptyUpdateAdvisoryState;
  try {
    state = await readState();
  } catch {
    // Cache reads are fallback only; they must not suppress startup.
  }

  // Non-persistent forced advisory state, e.g. the debug remote env, is already authoritative.
  if (!state.path && state.hasUpdate) return state;

  startRootUpdateAdvisoryProbe(deps);
  return state;
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

function startRootUpdateAdvisoryProbe(
  deps: { readonly probe?: typeof runUpdateAdvisoryProbe } = {},
) {
  if (deps.probe) return startInjectedRootUpdateAdvisoryProbe(deps.probe);
  void startDetachedRootUpdateAdvisoryProbe();
}

function startInjectedRootUpdateAdvisoryProbe(probe: typeof runUpdateAdvisoryProbe) {
  void (async () => {
    try {
      await probe();
    } catch {
      // Background advisory probes must never block the selected tool.
    }
  })();
}

async function startDetachedRootUpdateAdvisoryProbe() {
  try {
    const permission = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
    if (permission.state !== 'granted') return;

    const target = rootUpdateAdvisoryProbeTarget();
    Process.invokeDetached({
      cmd: Deno.execPath(),
      cwd: target.cwd,
      args: ['run', '-A', '--no-prompt', target.specifier],
      silent: true,
    });
  } catch {
    // Background advisory probes must never block the selected tool.
  }
}

function rootUpdateAdvisoryProbeTarget() {
  const current = new URL(import.meta.url);
  if (isLocalSourceUrl(current)) {
    return {
      cwd: Path.fromFileUrl(new URL('../../', current)),
      specifier: new URL('../cli.update/u.advisory.probe.ts', current).href,
    };
  }

  return {
    cwd: undefined,
    specifier: `jsr:${pkg.name}@${pkg.version}/update/advisory-probe`,
  };
}

function isLocalSourceUrl(url: URL) {
  return url.protocol === 'file:' && url.pathname.includes('/code/sys.tools/src/');
}

const emptyUpdateAdvisoryState: UpdateAdvisoryState = {
  path: undefined,
  record: undefined,
  hasUpdate: false,
  prelude: undefined,
};
