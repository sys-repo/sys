import { c, Cli, Fmt, Open, Str, type t } from '../common.ts';
import { type OpenMenuPick, OpenTargets } from './u.openTargets.ts';
import { startServer } from './u.startServer.ts';

type ServeResult = { readonly kind: 'back' } | { readonly kind: 'closed' };

/**
 * Start a local HTTP server for the given directory and run the interactive menu loop.
 */
export async function startServing(
  cwd: t.StringDir,
  location: t.ServeTool.LocationYaml.Location,
  opts: t.ServeTool.StartServerOpts = {},
): Promise<ServeResult> {
  const context = await startServer(location, { ...opts, silent: false });
  return await runOpenPromptLoop(cwd, context);
}

type OpenValue = OpenMenuPick | { cmd: 'reload' } | { cmd: 'back' };

/**
 * Helpers:
 */
async function runOpenPromptLoop(
  cwd: t.StringDir,
  context: t.ServeTool.StartServingContext,
): Promise<ServeResult> {
  const { location, host, port, baseUrl } = context;
  let didBack = false;
  let lastSelection: OpenValue | undefined;
  let notice: string | undefined;

  const toPath = (value: OpenValue): string => {
    if (value.cmd !== 'open') return '';
    return Str.trimLeadingSlashes(value.path);
  };

  const toUrl = (value: OpenValue): t.StringUrl => {
    const path = toPath(value);
    return `${baseUrl}/${path}`;
  };

  const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

  function renderHeader() {
    const str = Str.builder().blank();

    if (host === 'network') {
      str.line(`  Listening on ${c.cyan('http://')}${c.yellow('0.0.0.0')}${c.cyan(`:${port}/`)}`);
    } else {
      str.line(`  Listening on ${c.cyan(`${baseUrl}/`)}`);
    }

    if (lastSelection) {
      const path = toPath(lastSelection);
      if (path) {
        const url = `  ${baseUrl}/${path}`;
        str.line(`             ${c.dim(c.gray(url))}`);
      }
    }

    if (notice) str.line(`  ${notice}`);

    return String(str.blank());
  }

  const loadOpenMenu = async (text: string) => {
    const spinner = Cli.spinner(Fmt.spinnerText(text));
    spinner.start();
    try {
      return await OpenTargets.menuOptions(location);
    } finally {
      spinner.stop();
    }
  };

  let openMenu = await loadOpenMenu('indexing static targets...');

  const hasOpenPath = (path: string) => openMenu.some((item) => item.value.path === path);
  const syncLastSelection = () => {
    if (!lastSelection || lastSelection.cmd !== 'open') return;
    if (!hasOpenPath(lastSelection.path)) lastSelection = undefined;
  };

  async function promptOnce(): Promise<OpenValue> {
    const options = [
      ...openMenu,
      { name: c.dim(c.gray('  ↻ reload')), value: { cmd: 'reload' } },
      { name: Fmt.back({ indent: '  ' }), value: { cmd: 'back' } },
    ];
    console.clear();
    console.info(renderHeader());
    return (await Cli.Input.Select.prompt({
      message: 'HTTP Static',
      options,
      default: lastSelection,
      hideDefault: true,
      maxRows: 20,
    })) as OpenValue;
  }

  try {
    while (true) {
      const answer = await promptOnce();
      if (answer.cmd === 'reload') {
        try {
          openMenu = await loadOpenMenu('reloading static targets...');
          syncLastSelection();
          notice = undefined;
        } catch (error) {
          notice = c.red(`reload failed: ${errorMessage(error)}`);
        }
        continue;
      }
      if (answer.cmd === 'back') {
        didBack = true;
        break;
      }
      notice = undefined;
      lastSelection = answer;
      Open.invokeDetached(cwd, toUrl(answer));
    }
  } finally {
    await context.close();
  }

  return didBack ? { kind: 'back' } : { kind: 'closed' };
}
