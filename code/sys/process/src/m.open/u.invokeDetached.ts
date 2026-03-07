import { type t, Process } from './common.ts';
import { resolveCommand } from './u.resolveCommand.ts';

export function commandsFor(url: t.StringUrl, os: t.OpenOsInput = Deno.build.os): readonly t.OpenCommand[] {
  const primary = resolveCommand(url, os);
  if (os !== 'linux') return [primary];

  const candidates: t.OpenCommand[] = [
    { cmd: 'wslview', args: [url] },
    primary,
    { cmd: 'powershell.exe', args: ['-NoProfile', '-NonInteractive', '-Command', 'Start-Process', url] },
    { cmd: 'cmd.exe', args: ['/C', 'start', '', url] },
  ];

  const deduped = new Map<string, t.OpenCommand>();
  for (const item of candidates) {
    deduped.set(`${item.cmd}\0${item.args.join('\0')}`, item);
  }
  return [...deduped.values()];
}

export function invokeDetachedWithOs(
  cwd: t.StringDir,
  url: t.StringUrl,
  os: t.OpenOsInput,
  opts: t.OpenInvokeOptions = {},
) {
  const { silent = true } = opts;
  let lastNotFound: Deno.errors.NotFound | undefined;

  for (const { cmd, args } of commandsFor(url, os)) {
    try {
      void Process.invokeDetached({ cmd, args: [...args], cwd, silent });
      return;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        lastNotFound = error;
        continue;
      }
      throw error;
    }
  }

  if (lastNotFound) throw lastNotFound;
}

export const invokeDetached: t.OpenLib['invokeDetached'] = (cwd, url, opts = {}) => {
  invokeDetachedWithOs(cwd, url, Deno.build.os, opts);
};
