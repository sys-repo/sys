import { type t } from './common.ts';

export const resolveCommand: t.OpenLib['resolveCommand'] = (target, os = Deno.build.os) => {
  switch (os) {
    case 'windows':
      return { cmd: 'explorer.exe', args: [target] };
    case 'linux':
      return { cmd: 'xdg-open', args: [target] };
    case 'darwin':
    default:
      return { cmd: 'open', args: [target] };
  }
};
