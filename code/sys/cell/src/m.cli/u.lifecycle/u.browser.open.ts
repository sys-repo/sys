import { Open, Process, type t } from '../common.ts';

/** Hand the published href to the platform opener as argv, never to a command interpreter. */
export function openBrowserTarget(href: t.StringUrl, invoke = Process.invokeDetached): void {
  const { cmd, args } = Open.resolveCommand(href);
  // Do not use Open.invokeDetached's interpreter fallbacks if this executable is unavailable.
  invoke({ cmd, args: [...args], silent: true });
}
