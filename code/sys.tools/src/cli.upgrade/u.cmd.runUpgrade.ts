import { c, Cli, pkg, type t } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { refreshCache } from './u.refreshCache.ts';
import { writeUpgradeAdvisorySuccess } from './u.advisory.ts';
import { getVersionInfo } from './u.versionInfo.ts';
import { toVersionState } from './u.versionState.ts';

type Spinner = t.Cli.Spinner.Instance;

type RefreshResult = {
  readonly success: boolean;
  toString(): string;
};

type PromptOption = { name: string; value: string };
type Prompt = (args: {
  message: string;
  options: PromptOption[];
  hideDefault?: boolean;
}) => Promise<string>;
type GetVersionInfoOptions = { readonly resolverReload?: boolean };

type GetVersionInfo = (
  cwd: t.StringDir,
  options?: GetVersionInfoOptions,
) => Promise<t.UpgradeTool.VersionInfo>;
type WriteAdvisorySuccess = (version: t.UpgradeTool.VersionInfo) => Promise<void>;

type RunUpgradeSource = NonNullable<t.UpgradeTool.CliContext['origin']>;
type RunUpgradeResult = t.UpgradeTool.CliResult;

type RunUpgradeDeps = {
  readonly getVersionInfo: GetVersionInfo;
  readonly refreshCache: (
    cwd: t.StringDir,
    opts?: { readonly silent?: boolean },
  ) => Promise<RefreshResult>;
  readonly prompt: Prompt;
  readonly spinner: (text?: string) => Spinner;
  readonly info: (...data: unknown[]) => void;
  readonly writeAdvisorySuccess: WriteAdvisorySuccess;
};

/**
 * Upgrade JUST the @sys/tools CLI by refreshing the JSR cache.
 */
export async function runUpgrade(
  cwd: t.StringDir,
  opts: { interactive?: boolean; source?: RunUpgradeSource } = {},
  deps: RunUpgradeDeps = {
    getVersionInfo,
    refreshCache,
    prompt: Cli.Input.Select.prompt<string>,
    spinner: Cli.spinner,
    info: console.info,
    writeAdvisorySuccess: writeUpgradeAdvisorySuccess,
  },
): Promise<RunUpgradeResult> {
  const { interactive = false, source = 'argv' } = opts;
  const UPGRADE = 'upgrade';
  const EXIT = '__exit__';
  const BACK = '__back__';
  const RESCAN = '__rescan__';

  while (true) {
    const versionSpinner = deps.spinner();
    versionSpinner.start(
      Fmt.spinnerText(c.italic(c.gray(`checking latest ${c.white(pkg.name)} version...`))),
    );
    const version = await (async () => {
      try {
        return await deps.getVersionInfo(cwd, { resolverReload: false });
      } finally {
        versionSpinner.stop();
      }
    })();

    try {
      await deps.writeAdvisorySuccess(version);
    } catch {
      // Advisory persistence must remain fail-quiet.
    }

    const state = toVersionState(version);

    deps.info();
    deps.info(Fmt.versionInfoTable(version));
    deps.info();

    if (!state.upgradeAvailable) {
      deps.info(
        state.resolverUnavailable
          ? Fmt.upgradeResolverUnavailable(version)
          : state.pending
          ? Fmt.upgradePending(version)
          : Fmt.localVersionIsMostRecent(version),
      );
      deps.info();

      if (interactive && source === 'root-menu') {
        const answer = await deps.prompt({
          message: 'No upgrades',
          options: [
            { name: '  rescan', value: RESCAN },
            { name: Fmt.back(), value: BACK },
          ],
          hideDefault: true,
        });
        if (answer === RESCAN) {
          deps.info();
          continue;
        }
        if (answer === BACK) return { kind: 'back' };
      }

      return;
    }

    if (interactive) {
      const fromRootMenu = source === 'root-menu';
      const cancelValue = fromRootMenu ? BACK : EXIT;
      const target = verifiedActionableTarget(state);
      const upgradeName = formatUpgradeOption({
        prefix: fromRootMenu ? '  ' : ' - ',
        target,
      });
      const cancelName = fromRootMenu ? Fmt.back() : c.dim(c.gray(`(exit)`));

      const answer = await deps.prompt({
        message: 'Run',
        options: [
          { name: upgradeName, value: UPGRADE },
          { name: cancelName, value: cancelValue },
        ],
      });

      if (answer === BACK) {
        deps.info();
        return { kind: 'back' };
      }

      if (answer === EXIT) {
        deps.info();
        return;
      }
    }

    const target = verifiedActionableTarget(state);
    const msg = formatUpgradeSpinnerText(version, target);

    /** Run process: */
    const spinner = deps.spinner();
    spinner.start(Cli.Fmt.spinnerRaw(msg));
    const out = await (async () => {
      try {
        return await deps.refreshCache(cwd);
      } finally {
        spinner.stop();
      }
    })();

    if (!out.success) {
      const msg =
        `Failed to refresh JSR cache for ${pkg.name}. Command: deno cache --reload --no-config --no-lock jsr:@sys/tools\n${out.toString()}`;
      throw new Error(msg);
    }

    const verified = await deps.getVersionInfo(cwd, { resolverReload: true });
    if (!resolvesPublicSpecifierTo(verified, target)) {
      throw new Error(
        [
          `Failed to verify ${pkg.name} upgrade.`,
          `Expected upgrade version ${target}; ${formatVerifiedState(verified)}.`,
        ].join(' '),
      );
    }

    deps.info(formatUpgradeSuccess(target));
    deps.info();
    return;
  }
}

/**
 * Helpers:
 */

function formatUpgradeOption(args: { prefix: string; target: t.StringSemver }) {
  const { prefix, target } = args;
  return `${prefix}${c.green('upgrade now to')} ${c.white(target)}`;
}

function formatUpgradeSpinnerText(version: t.UpgradeTool.VersionInfo, target: t.StringSemver) {
  return [
    c.gray(c.italic('upgrading ')),
    c.white(pkg.name),
    c.gray(c.italic(` from ${version.local} to `)),
    c.white(target),
    c.gray(c.italic('...')),
  ].join('');
}

function formatUpgradeSuccess(target: t.StringSemver) {
  return [
    c.gray('Upgraded '),
    c.white(pkg.name),
    c.gray(' to '),
    c.green(`${target} ✔`),
  ].join('');
}

function verifiedActionableTarget(state: t.UpgradeTool.VersionState): t.StringSemver {
  if (state.actionable) return state.actionable;
  throw new Error(`Cannot run ${pkg.name} upgrade without a verified upgrade version.`);
}

function resolvesPublicSpecifierTo(
  version: t.UpgradeTool.VersionInfo,
  target: t.StringSemver,
) {
  return version.resolution?.ok === true && version.resolution.resolved === target;
}

function formatVerifiedState(version: t.UpgradeTool.VersionInfo) {
  const state = toVersionState(version);
  if (version.resolution?.ok === true) {
    return `public specifier resolved ${version.resolution.resolved}`;
  }
  if (state.resolverUnavailable) return 'Deno resolver state is unavailable';
  if (!state.actionable) return 'no upgrade version was reported';
  return `upgrade check reported ${state.actionable}`;
}
