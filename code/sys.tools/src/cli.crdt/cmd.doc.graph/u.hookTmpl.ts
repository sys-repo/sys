import { json } from '../../-tmpl/bundle/-bundle.ts';
import { type t, D, Fs, TmplEngine, c } from '../common.ts';

export async function makeHookTmpl(cwd: t.StringDir) {
  const path = {
    source: Fs.join(cwd),
    target: Fs.join(cwd),
  } as const;

  const filepath = Fs.join(path.target, D.Hook.filename);
  const exists = await Fs.exists(filepath);

  const write = async (opts: { force?: boolean } = {}) => {
    if (exists && !opts.force) {
      console.info(c.yellow(c.italic('Hook file already exists')));
      return;
    }

    const dir = 'cli.crdt/-tmpl/';
    const filemap = Object.fromEntries(
      Object.entries(json)
        .filter(([k]) => k.startsWith(dir))
        .map(([k, v]) => [k.slice(dir.length), v]),
    );

    await TmplEngine.makeTmpl(filemap).write(path.target, {});
    console.info(c.gray(`${c.green('Hook')} written to file ${c.white(Fs.trimCwd(filepath))}`));
  };

  return { exists, write } as const;
}
