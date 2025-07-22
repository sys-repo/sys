import { Templates, tmplFilter } from '../code/-tmpl/src/mod.ts';
import { c, Cli, Fs, Tmpl } from './common.ts';

type Options = { argv?: string[] };
type TArgs = { tmpl?: string | boolean };

/**
 * COMMAND 🌳 Create selected template:
 */
export async function main(options: Options = {}) {
  const args = Cli.args<TArgs>(options.argv ?? Deno.args);
  console.info(c.gray('args:'), args);
  console.info();

  let name = typeof args.tmpl === 'string' ? args.tmpl : '';
  const templates = Object.keys(Templates);

  if (!name) {
    name = await Cli.Prompt.Select.prompt({
      message: 'Select Template:',
      options: templates.map((name: string) => ({ name, value: name })),
    });
  }

  if (!templates.includes(name)) {
    const msg = `${c.yellow('Failed:')} A template named "${c.white(name)}" does not exist.`;
    console.info();
    console.warn(c.gray(msg));
    console.info(c.gray(c.italic('(pass nothing for interactive list)')));
    console.info();
    return;
  }

  const dirname = await Cli.Prompt.Input.prompt('Directory Name:');
  const targetDir = Fs.join(Fs.cwd('terminal'), dirname);

  if (await Fs.exists(targetDir)) {
    const noChange = c.green('No Change');
    const msg = `${c.yellow('Warning:')} Something already exists at that location (${noChange}).`;
    console.info();
    console.warn(c.gray(msg));
    console.warn(c.gray(targetDir));
    console.info();
    return;
  }

  const source = await Templates[name as keyof typeof Templates]();
  if (!source.dir) {
    const whiteName = c.white(name);
    const err = `The template named "${whiteName}" does not export a "dir" from the -.tmpl.ts file.`;
    const msg = `${c.yellow('Failed:')} ${err}`;
    console.info();
    console.warn(c.gray(msg));
    console.info();
    return;
  }

  const tmpl = Tmpl.create(source.dir).filter(tmplFilter);
  const res = await tmpl.write(targetDir, { afterWrite: (e) => source.default(e) });

  console.info(c.gray(`Target: ${Fs.trimCwd(targetDir)}`));
  console.info();
  console.info(Tmpl.Log.table(res.ops));
  console.info();
}
