import { c, Cli, Fs, Tmpl } from './common.ts';

type Options = {
  argv?: string[];
};

const Templates = {
  'm.mod': 'code/-tmpl/m.mod/',
  'm.mod.ui': 'code/-tmpl/m.mod.ui/',
  'pkg.deno': 'code/-tmpl/deno/',
} as const;

type TArgs = {
  tmpl?: string | boolean;
};

/**
 * COMMAND 🌳 Create from template action.
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
  const targetDir = Fs.join(Fs.cwd('init'), dirname);

  if (await Fs.exists(targetDir)) {
    const noChange = c.green('No Change');
    const msg = `${c.yellow('Warning:')} Something already exists at that location (${noChange}).`;
    console.info();
    console.warn(c.gray(msg));
    console.warn(c.gray(targetDir));
    console.info();
    return;
  }

  const sourceDir = Fs.resolve(Templates[name as keyof typeof Templates]);
  const tmpl = Tmpl.create(sourceDir);
  const res = await tmpl.write(targetDir);

  console.info(c.gray(`Target: ${Fs.trimCwd(targetDir)}`));
  console.info();
  console.info(Tmpl.Log.table(res.ops));
  console.info();
}
