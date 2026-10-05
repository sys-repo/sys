import type { UpgradeAdvisoryState } from '../cli.upgrade/u.advisory.ts';
import { Path, pkg, Process } from './common.ts';
import {
  type RootUpgradeAdvisoryOptions,
  RootUpgradeAdvisoryPolicy,
} from './u.upgradeAdvisory.policy.ts';

type ReadUpgradeAdvisoryState = () => Promise<UpgradeAdvisoryState>;
type RootUpgradeAdvisoryProbe = () => Promise<unknown>;

export async function prepareRootUpgradeAdvisory(
  deps: RootUpgradeAdvisoryOptions & {
    readonly readState?: ReadUpgradeAdvisoryState;
    readonly probe?: RootUpgradeAdvisoryProbe;
  } = {},
): Promise<UpgradeAdvisoryState> {
  if (RootUpgradeAdvisoryPolicy.isDisabled(deps)) return emptyUpgradeAdvisoryState;

  const readState = deps.readState ??
    (await import('../cli.upgrade/u.advisory.ts')).readUpgradeAdvisoryState;

  let state = emptyUpgradeAdvisoryState;
  try {
    state = await readState();
  } catch {
    // Cache reads are fallback only; they must not suppress startup.
  }

  // Non-persistent forced advisory state, e.g. the debug remote env, is already authoritative.
  if (!state.path && state.hasUpgrade) return state;

  startRootUpgradeAdvisoryProbe(deps);
  return state;
}

export async function runWithRootUpgradeAdvisory<T>(
  fn: () => Promise<T>,
  deps: RootUpgradeAdvisoryOptions & {
    readonly readState?: ReadUpgradeAdvisoryState;
    readonly probe?: RootUpgradeAdvisoryProbe;
    readonly info?: (...data: unknown[]) => void;
  } = {},
): Promise<T> {
  try {
    const state = await prepareRootUpgradeAdvisory(deps);
    if (state.prelude) (deps.info ?? console.info)(state.prelude);
  } catch {
    // Advisory checks must never block the selected tool.
  }

  return await fn();
}

function startRootUpgradeAdvisoryProbe(
  deps: { readonly probe?: RootUpgradeAdvisoryProbe } = {},
) {
  if (deps.probe) return startInjectedRootUpgradeAdvisoryProbe(deps.probe);
  void startDetachedRootUpgradeAdvisoryProbe();
}

function startInjectedRootUpgradeAdvisoryProbe(probe: RootUpgradeAdvisoryProbe) {
  void (async () => {
    try {
      await probe();
    } catch {
      // Background advisory probes must never block the selected tool.
    }
  })();
}

async function startDetachedRootUpgradeAdvisoryProbe() {
  try {
    const permission = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
    if (permission.state !== 'granted') return;

    const target = rootUpgradeAdvisoryProbeTarget();
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

function rootUpgradeAdvisoryProbeTarget() {
  const current = new URL(import.meta.url);
  if (isLocalSourceUrl(current)) {
    return {
      cwd: Path.fromFileUrl(new URL('../../', current)),
      specifier: new URL('../cli.upgrade/u.advisory.probe.ts', current).href,
    };
  }

  return {
    cwd: undefined,
    specifier: `jsr:${pkg.name}@${pkg.version}/upgrade/advisory-probe`,
  };
}

function isLocalSourceUrl(url: URL) {
  return url.protocol === 'file:' && url.pathname.includes('/code/sys.tools/src/');
}

const emptyUpgradeAdvisoryState: UpgradeAdvisoryState = {
  path: undefined,
  record: undefined,
  hasUpgrade: false,
  prelude: undefined,
};
