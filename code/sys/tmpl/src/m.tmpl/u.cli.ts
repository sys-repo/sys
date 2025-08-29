import { type t, c, Cli, Fs, Templates, Tmpl, tmplFilter } from './common.ts';

type TArgs = {
  tmpl?: string | boolean;
  dryRun?: boolean;
};

/**
 * Run in CLI mode.
 */
export const cli: t.StdTmplLib['cli'] = async (options = {}) => {
  const args = Cli.args<TArgs>(options.argv ?? Deno.args);
  const dryRun = options.dryRun ?? args.dryRun ?? false;

  let name = typeof args.tmpl === 'string' ? args.tmpl : '';
  const templates = [...Object.keys(Templates), '@sys/ui-factory/tmpl'];

  if (!name) {
    const label = (v: string) => (v.startsWith('@') ? `run:   ${v}` : `make:  ${v}`);
    name = await Cli.Prompt.Select.prompt({
      message: 'Select Template:',
      options: templates.map((value: string) => ({ name: label(value), value })),
    });
  }

  /**
   * Defer to external library templates:
   */
  if (name === '@sys/ui-factory/tmpl') {
    const { Tmpl } = await import('@sys/ui-factory/tmpl');
    return void (await Tmpl.cli({ dryRun }));
  }

  /**
   * Run local templates:
   */
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

  /**
   * Write:
   */
  const tmpl = Tmpl.create(source.dir).filter(tmplFilter);
  const res = await tmpl.write(targetDir, {
    dryRun,
    afterWrite: (e) => source.default(e),
  });

  /**
   * Print:
   */
  console.info(c.gray(`Target: ${Fs.trimCwd(targetDir)}`));
  console.info();
  console.info(Tmpl.Log.table(res.ops));
  console.info();
};
