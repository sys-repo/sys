import { type t, c, Cli, pkg } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { refreshCache } from './u.refreshCache.ts';
import { getVersionInfo } from './u.ts';

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

type RunUpdateDeps = {
  readonly getVersionInfo: typeof getVersionInfo;
  readonly refreshCache: (cwd: t.StringDir, opts?: { silent?: boolean }) => Promise<RefreshResult>;
  readonly prompt: typeof Cli.Input.Select.prompt<string>;
  readonly spinner: (text?: string) => Spinner;
  readonly info: (...data: unknown[]) => void;
};

/**
 * Update JUST the @sys/tools CLI by refreshing the JSR cache.
 */
export async function runUpdate(
  cwd: t.StringDir,
  opts: { interactive?: boolean } = {},
  deps: RunUpdateDeps = {
    getVersionInfo,
    refreshCache,
    prompt: Cli.Input.Select.prompt<string>,
    spinner: Cli.spinner,
    info: console.info,
  },
): Promise<void> {
  const { interactive = false } = opts;
  const versionSpinner = deps.spinner();
  versionSpinner.start(Fmt.spinnerText(c.italic(c.gray(`checking latest ${c.white(pkg.name)} version...`))));
  const version = await (async () => {
    try {
      return await deps.getVersionInfo();
    } finally {
      versionSpinner.stop();
    }
  })();

  deps.info();
  deps.info(Fmt.versionInfoTable(version));
  deps.info();

  if (version.is.latest) {
    deps.info(Fmt.localVersionIsMostRecent(version));
    deps.info();
    return;
  }

  const UPDATE = 'update';
  const EXIT = '__exit__';

  if (interactive) {
    const answer = await deps.prompt({
      message: 'Run',
      options: [
        { name: ` - update to ${c.green(version.latest)} now`, value: UPDATE },
        { name: c.dim(c.gray(`(exit)`)), value: EXIT },
      ],
    });

    if (answer === EXIT) {
      deps.info();
      return;
    }
  }

  const msg = `updating ${c.white(pkg.name)} from ${version.local} to ${c.green(version.latest)}...`;

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
    const msg = `Failed to refresh JSR cache for ${pkg.name}. Command: deno cache --reload jsr:@sys/tools\n${out.toString()}`;
    throw new Error(msg);
  }

  deps.info(c.gray(`Updated ${c.white(pkg.name)} to latest ${c.green(version.latest + ' ✔')}`));
  deps.info();
}
