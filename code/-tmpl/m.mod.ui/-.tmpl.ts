import { type t, Cli, Fs, Str } from '../common.ts';

/**
 * Setup the template:
 */
export const dir = import.meta.dirname;
export default async function setup(e: t.TmplWriteHandlerArgs) {
  const name = await Cli.Prompt.Input.prompt({ message: 'Component Name:' });

  const dir = Fs.glob(e.dir.target.absolute);
  const paths = await dir.find('**/*.{ts,tsx}', { includeDirs: false });

  for (const { path } of paths) {
    const text = (await Fs.readText(path)).data;
    if (text) {
      const res = Str.replaceAll(text, 'MyComponent', name);
      if (res.changed) await Fs.write(path, res.after, { force: true });
    }
  }
}
