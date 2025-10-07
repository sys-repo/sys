import { type t, c } from './common.ts';
import { Is } from './m.Is.ts';

export const init: t.EnvLib['init'] = async () => {
  const { Fs } = await import('@sys/fs');
  let added = false;

  /**
   * Add basic Deno project setup if running within VSCode:
   */
  if (Is.vscode) {
    const dir = Fs.cwd();
    const pathname = '.vscode/settings.json';
    const path = Fs.join(dir, pathname);
    const exists = await Fs.exists(path);

    if (!exists) {
      const settings = {
        'deno.enable': true,
        'deno.lint': false,
        'deno.unstable': [],
      };
      await Fs.writeJson(path, settings);
      added = true;
      console.info(c.gray(`Added: ${c.cyan(pathname)}`));
    }
  }

  if (!added) {
    console.info(c.gray(`No environment templates added.`));
  }
};
