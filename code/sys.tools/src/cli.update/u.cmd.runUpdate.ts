import { c, Cli, pkg, type t } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { refreshCache } from './u.refreshCache.ts';
import { getVersionInfo } from './u.ts';
import { writeUpdateAdvisorySuccess } from './u.advisory.ts';

type Spinner = {
  text: string;
  start(text?: string): Spinner;
  stop(): Spinner;
  succeed(text?: string): Spinner;
  fail(text?: string): Spinner;
};

type RefreshResult = {
  readonly success: boolean;
  toString(): string;
};

type RunUpdateSource = NonNullable<t.UpdateTool.CliContext['origin']>;
type RunUpdateResult = t.UpdateTool.CliResult;

type RunUpdateDeps = {
  readonly getVersionInfo: typeof getVersionInfo;
  readonly refreshCache: (cwd: t.StringDir, opts?: { silent?: boolean }) => Promise<RefreshResult>;
  readonly prompt: typeof Cli.Input.Select.prompt<string>;
  readonly spinner: (text?: string) => Spinner;
  readonly info: (...data: unknown[]) => void;
  readonly writeAdvisorySuccess: typeof writeUpdateAdvisorySuccess;
};

/**
 * Update JUST the @sys/tools CLI by refreshing the JSR cache.
 */
export async function runUpdate(
  cwd: t.StringDir,
  opts: { interactive?: boolean; source?: RunUpdateSource } = {},
  deps: RunUpdateDeps = {
    getVersionInfo,
    refreshCache,
    prompt: Cli.Input.Select.prompt<string>,
    spinner: Cli.spinner,
    info: console.info,
    writeAdvisorySuccess: writeUpdateAdvisorySuccess,
  },
): Promise<RunUpdateResult> {
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
        return await deps.getVersionInfo();
      } finally {
        versionSpinner.stop();
      }
    })();

    try {
      await deps.writeAdvisorySuccess(version.remote);
    } catch {
      // Advisory persistence must remain fail-quiet.
    }

    deps.info();
    deps.info(Fmt.versionInfoTable(version));
    deps.info();

    if (version.is.latest) {
      deps.info(Fmt.localVersionIsMostRecent(version));
      deps.info();

      if (interactive && source === 'root-menu') {
        const answer = await deps.prompt({
          message: 'No updates',
          options: [
            { name: '  rescan', value: RESCAN },
            { name: c.gray('← back'), value: BACK },
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
      const upgradeName = fromRootMenu
        ? `  upgrade to ${c.green(version.latest)} now`
        : ` - upgrade to ${c.green(version.latest)} now`;
      const cancelName = fromRootMenu ? c.gray('← back') : c.dim(c.gray(`(exit)`));

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

    const msg = `upgrading ${c.white(pkg.name)} from ${version.local} to ${
      c.green(version.latest)
    }...`;

    /** Run process: */
    const spinner = deps.spinner();
    spinner.start(Cli.Fmt.spinnerText(msg));
    const out = await (async () => {
      try {
        return await deps.refreshCache(cwd);
      } finally {
        spinner.stop();
      }
    })();

    if (!out.success) {
      const msg =
        `Failed to refresh JSR cache for ${pkg.name}. Command: deno cache --reload jsr:@sys/tools\n${out.toString()}`;
      throw new Error(msg);
    }

    deps.info(c.gray(`Updated ${c.white(pkg.name)} to latest ${c.green(version.latest + ' ✔')}`));
    deps.info();
    return;
  }
}
