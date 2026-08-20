import { BootstrapStatus, pkg, StartGuiIntrinsic, Str, type t } from './common.ts';
import type { BootStateSource } from './u.state.ts';

export type BootstrapPageKey =
  | 'preparing'
  | 'starting-app-host'
  | 'failed-configuration-invalid'
  | 'failed-source-unavailable'
  | 'failed-artifact-refused'
  | 'failed-repair-required'
  | 'failed-local-failure'
  | 'failed-cancelled'
  | 'stopping';

type PageCopy = {
  title: string;
  message: string;
  heading?: string;
  refresh?: 'reload';
};

const encoder = new TextEncoder();
const freeze = Object.freeze;
const applicationName = `${pkg.name}/ui`;
const bodyStyle =
  'font-family:sans-serif;font-size:16px;line-height:1.3;margin:0;padding:24px 30px';
const titleStyle = 'font-size:inherit;line-height:inherit;font-weight:700;margin:0';
const messageStyle = 'font-size:inherit;line-height:inherit;font-weight:400;margin:4px 0 0';
const couldNotStart = `${applicationName} could not start`;

/** Encode one finite package-owned page; all copy is declared below. */
function page(
  key: BootstrapPageKey,
  copy: PageCopy,
): t.BootstrapStatus.Page<BootstrapPageKey> {
  const refresh = copy.refresh === 'reload' ? '<meta http-equiv="refresh" content="1">' : '';
  const html = Str.dedent(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        ${refresh}
        <title>${copy.title}</title>
      </head>
      <body style="${bodyStyle}">
        <main>
          <h1 style="${titleStyle}">${copy.heading ?? copy.title}</h1>
          <p style="${messageStyle}">${copy.message}</p>
        </main>
      </body>
    </html>
  `);
  return freeze({ key, bytes: encoder.encode(html) });
}

/** Finite package-owned browser pages; no artifact or failure evidence is interpolated. */
const BOOTSTRAP_PAGES = freeze(
  [
    page('preparing', {
      title: `Preparing ${applicationName}`,
      message: `${applicationName} is preparing the application.`,
      refresh: 'reload',
    }),
    page('starting-app-host', {
      title: `Starting ${applicationName}`,
      message: 'The application host is starting.',
      refresh: 'reload',
    }),
    page('failed-configuration-invalid', {
      title: `${applicationName} configuration invalid`,
      heading: couldNotStart,
      message:
        'The launcher configuration is invalid. Return to the terminal for safe details, then restart.',
    }),
    page('failed-source-unavailable', {
      title: `${applicationName} source unavailable`,
      heading: couldNotStart,
      message:
        'The application source is unavailable. Return to the terminal for safe details, then restart.',
    }),
    page('failed-artifact-refused', {
      title: `${applicationName} artifact refused`,
      heading: couldNotStart,
      message:
        'The application artifact was refused. Return to the terminal for safe details, then restart.',
    }),
    page('failed-repair-required', {
      title: `${applicationName} repair required`,
      heading: couldNotStart,
      message:
        'The local application cache requires trusted repair. Return to the terminal for guidance.',
    }),
    page('failed-local-failure', {
      title: `${applicationName} local failure`,
      heading: couldNotStart,
      message:
        'A local startup operation failed. Return to the terminal for safe details, then restart.',
    }),
    page('failed-cancelled', {
      title: `${applicationName} launch cancelled`,
      message: 'The trusted launcher cancelled startup.',
    }),
    page('stopping', {
      title: `Stopping ${applicationName}`,
      message: 'The local application session is closing.',
    }),
  ] satisfies readonly t.BootstrapStatus.Page<BootstrapPageKey>[],
);

/** Start the generic status host over one synchronous Driver Pi state projection. */
export function startBootstrap(
  state: BootStateSource,
  start: typeof BootstrapStatus.start = BootstrapStatus.start,
): Promise<t.BootstrapStatus.Started> {
  return start({
    pages: freeze(
      StartGuiIntrinsic.arrayMap(
        BOOTSTRAP_PAGES,
        (page) => freeze({ key: page.key, bytes: StartGuiIntrinsic.uint8ArraySlice(page.bytes) }),
      ),
    ),
    resolve: () => projectBootstrap(state),
  });
}

/** Project only a finite page key or the admitted application origin. */
export function projectBootstrap(
  state: BootStateSource,
): t.BootstrapStatus.Projection<BootstrapPageKey> {
  const current = state.current;
  switch (current.kind) {
    case 'ready':
      return freeze({ kind: 'redirect', origin: current.origin });
    case 'failed':
      return freeze({ kind: 'page', key: `failed-${current.category}` });
    default:
      return freeze({ kind: 'page', key: current.kind });
  }
}
