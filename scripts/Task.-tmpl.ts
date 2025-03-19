import { c, Cli, Fs, Tmpl } from './common.ts';

type Options = {
  argv?: string[];
};

const Templates = {
  mod: 'code/-tmpl/m.mod/',
  'mod.ui': 'code/-tmpl/m.mod.ui/',
  deno: 'code/-tmpl/deno/',
} as const;

type TArgs = {
  create?: string | boolean;
};

export async function main(options: Options = {}) {
  const args = Cli.args<TArgs>(options.argv ?? Deno.args);

  let name = typeof args.create === 'string' ? args.create : '';
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
