import { type t, c, Cli, Fs, Is, pkg, TemplateNames, Templates, TmplEngine } from './common.ts';
import { makeTmpl } from './u.makeTmpl.ts';
import { Prompt } from './u.prompt.ts';
import { type CliParsedArgs } from './u.args.ts';

type SetupOptions = {
  pkgName?: string;
  name?: string;
};

/**
 * CLI entry (interactive by default, deterministic when non-interactive).
 */
export async function cli(cwd: t.StringDir = Fs.cwd('terminal'), args: CliParsedArgs): Promise<void> {
  console.info(c.gray(`${c.green('Current:')} ${Cli.Fmt.Path.str(`${cwd}/`)}`));

  const root = await resolveTemplate(args);
  if (root === '@sys/ui-factory/tmpl') return void (await runUiFactory(args));

  const tmplName = assertLocalTemplate(root);
  const targetDir = await resolveTargetDir(cwd, args);
  if ((await Fs.exists(targetDir)) && !args.force) {
    if (args.interactive) {
      const noChange = c.green('No Change');
      const msg = `${c.yellow('Warning:')} Something already exists at that location (${noChange}).`;
      console.info();
      console.warn(c.gray(msg));
      console.warn(c.gray(targetDir));
      console.info();
      return;
    }

    throw new Error(`Target directory already exists: "${targetDir}". Use --force to allow overwrite.`);
  }

  const tmplSetup = await Templates[tmplName]();
  if (!Is.func(tmplSetup.default)) {
    throw new Error(
      `The template named "${root}" does not export a default function from its '.tmpl.ts' file.`,
    );
  }

  const options = resolveSetupOptions(tmplName, args);
  const tmpl = await makeTmpl(tmplName);
  const res = await tmpl.write(targetDir, { dryRun: args.dryRun, force: args.force });
  await tmplSetup.default(res.dir.target, options);

  const { ops } = res;
  const location = Cli.Fmt.Path.str(`${Fs.trimCwd(targetDir)}/`);
  console.info();
  console.info(c.brightCyan(`${pkg.name}`));
  console.info(c.gray(`location: ${location}`));
  console.info(c.gray(`template: ${c.bold(c.green(`${root}`))}`));
  console.info();
  console.info(TmplEngine.Log.table(ops, targetDir));
  console.info();
}

async function resolveTemplate(args: CliParsedArgs): Promise<string> {
  if (Is.str(args.tmpl) && args.tmpl.length > 0) return args.tmpl;
  if (args.interactive) return Prompt.selectTemplate();
  throw new Error('Missing required argument: <tmpl>. Provide a template name when using --no-interactive.');
}

function assertLocalTemplate(name: string): t.TemplateName {
  if (!TemplateNames.includes(name)) {
    throw new Error(`Unknown template: "${name}".`);
  }

  if (name === '@sys/ui-factory/tmpl') {
    throw new Error(`Template "${name}" is external and not handled as a local template.`);
  }

  return name as t.TemplateName;
}

async function resolveTargetDir(cwd: t.StringDir, args: CliParsedArgs): Promise<t.StringAbsoluteDir> {
  if (Is.str(args.dir) && args.dir.length > 0) return Fs.resolve(cwd, args.dir) as t.StringAbsoluteDir;
  if (args.interactive) return Prompt.directoryName(cwd);
  throw new Error('Missing required flag: --dir (required with --no-interactive).');
}

function resolveSetupOptions(tmplName: t.TemplateName, args: CliParsedArgs): SetupOptions {
  if (tmplName === 'pkg.deno') {
    if (!Is.str(args.pkgName) && !args.interactive) {
      throw new Error(`Template "${tmplName}" requires --pkgName in --no-interactive mode.`);
    }
    return { pkgName: args.pkgName };
  }

  if (tmplName === 'm.mod.ui' || tmplName === 'm.mod.ui.controller') {
    if (!Is.str(args.name) && !args.interactive) {
      throw new Error(`Template "${tmplName}" requires --name in --no-interactive mode.`);
    }
    return { name: args.name };
  }

  return {};
}

/**
 * TODO: remove this passthrough once ui-factory is retired from @sys/tmpl template selection.
 */
async function runUiFactory(args: CliParsedArgs) {
  if (!args.interactive) {
    throw new Error(
      'Template "@sys/ui-factory/tmpl" is interactive-only from @sys/tmpl; remove --no-interactive or use @sys/ui-factory directly.',
    );
  }

  const { cli } = await import('@sys/ui-factory/tmpl');
  await cli({ dryRun: args.dryRun, force: args.force });
}
