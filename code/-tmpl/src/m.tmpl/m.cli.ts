import { c, Cli, Fs, Is, pkg, type t, TemplateNames, Templates, TmplEngine } from './common.ts';
import { makeTmpl } from './u.makeTmpl.ts';
import { Prompt } from './u.prompt.ts';
import { type CliParsedArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';

type SetupOptions = {
  pkgName?: string;
  name?: string;
  force?: boolean;
  dryRun?: boolean;
};

type TemplateSetup = (
  dir: t.StringAbsoluteDir,
  options?: SetupOptions,
) => unknown | Promise<unknown>;
type TemplatePreflight = (
  dir: t.StringAbsoluteDir,
  options?: SetupOptions,
) => unknown | Promise<unknown>;
type TemplateModule = {
  default?: TemplateSetup;
  preflight?: TemplatePreflight;
};

const DslCommand = 'deno run -ERW jsr:@sys/tmpl dsl';

/**
 * CLI entry (interactive by default, deterministic when non-interactive).
 */
export async function cli(
  cwd: t.StringDir = Fs.cwd('terminal'),
  args: CliParsedArgs,
): Promise<void> {
  console.info(c.gray(`${c.green('working dir:')} ${Cli.Fmt.Path.str(`${cwd}/`)}`));

  const root = await resolveTemplate(args);
  const tmplName = assertLocalTemplate(root);
  const targetDir = await resolveTargetDir(cwd, args);
  const targetExists = await Fs.exists(targetDir);

  if (isExistingPackageTemplate(tmplName)) {
    await assertExistingPackageTarget(tmplName, targetDir);
  } else if (targetExists && !args.force) {
    if (args.interactive) {
      const noChange = c.green('No Change');
      const msg = `${
        c.yellow('Warning:')
      } Something already exists at that location (${noChange}).`;
      console.info();
      console.warn(c.gray(msg));
      console.warn(c.gray(targetDir));
      console.info();
      return;
    }

    throw new Error(
      `Target directory already exists: "${targetDir}". Use --force to allow overwrite.`,
    );
  }

  const tmplSetup = (await Templates[tmplName]()) as TemplateModule;
  if (!Is.func(tmplSetup.default)) {
    throw new Error(
      `The template named "${root}" does not export a default function from its '.tmpl.ts' file.`,
    );
  }

  const templateOptions = resolveSetupOptions(tmplName, args);
  const runOptions = { ...templateOptions, dryRun: args.dryRun, force: args.force };
  if (Is.func(tmplSetup.preflight)) await tmplSetup.preflight(targetDir, runOptions);

  const tmpl = await makeTmpl(tmplName);
  const res = await tmpl.write(targetDir, { dryRun: args.dryRun, force: args.force });
  if (!args.dryRun) {
    await tmplSetup.default(res.dir.target, runOptions);
  }
  const commitOptions = await resolveCommitOptions(tmplName, targetDir, templateOptions);

  const { ops } = res;
  const location = Cli.Fmt.Path.str(`${Fs.trimCwd(targetDir)}/`);
  console.info();
  console.info(c.brightCyan(`${pkg.name}`));
  console.info(c.gray(`location: ${location}`));
  console.info(c.gray(`template: ${c.bold(c.brightCyan(`${root}`))}`));
  console.info();
  console.info(TmplEngine.Log.table(ops, targetDir));
  console.info();
  console.info(
    Fmt.finalCommit({
      tmpl: tmplName,
      targetDir,
      cwd,
      ops,
      options: { ...commitOptions, dryRun: args.dryRun },
    }),
  );
  console.info();
}

async function resolveTemplate(args: CliParsedArgs): Promise<string> {
  if (Is.str(args.tmpl) && args.tmpl.length > 0) return args.tmpl;
  if (args.interactive) return Prompt.selectTemplate();
  throw scaffoldArgError(
    'Missing required argument: <tmpl>. Provide a template name when using --non-interactive.',
  );
}

function assertLocalTemplate(name: string): t.TemplateName {
  if (!TemplateNames.includes(name)) {
    throw scaffoldArgError(`Unknown template: "${name}".`);
  }

  return name as t.TemplateName;
}

async function resolveTargetDir(
  cwd: t.StringDir,
  args: CliParsedArgs,
): Promise<t.StringAbsoluteDir> {
  if (Is.str(args.dir) && args.dir.length > 0) {
    return Fs.resolve(cwd, args.dir) as t.StringAbsoluteDir;
  }
  if (args.interactive) return Prompt.directoryName(cwd);
  throw scaffoldArgError(
    'Missing required flag: --dir (required with --non-interactive).',
    args.tmpl,
  );
}

async function assertExistingPackageTarget(
  tmplName: t.TemplateName,
  targetDir: t.StringAbsoluteDir,
) {
  const denoJson = Fs.join(targetDir, 'deno.json');
  if (await Fs.exists(denoJson)) return;

  throw scaffoldArgError(
    `Template "${tmplName}" requires --dir to target an existing package root with deno.json.`,
    tmplName,
  );
}

function isExistingPackageTemplate(tmplName: t.TemplateName): boolean {
  return tmplName === 'pkg.help';
}

function resolveSetupOptions(tmplName: t.TemplateName, args: CliParsedArgs): SetupOptions {
  if (tmplName === 'pkg') {
    assertTemplateFlags(tmplName, args, ['pkgName']);
    if (!Is.str(args.pkgName) && !args.interactive) {
      throw scaffoldArgError(
        `Template "${tmplName}" requires --pkgName in --non-interactive mode.`,
        tmplName,
      );
    }
    return { pkgName: args.pkgName };
  }

  if (tmplName === 'm.mod.ui' || tmplName === 'm.mod.ui.controller') {
    assertTemplateFlags(tmplName, args, ['name']);
    if (!Is.str(args.name) && !args.interactive) {
      throw scaffoldArgError(
        `Template "${tmplName}" requires --name in --non-interactive mode.`,
        tmplName,
      );
    }
    return { name: args.name };
  }

  assertTemplateFlags(tmplName, args, []);
  return {};
}

function assertTemplateFlags(
  tmplName: t.TemplateName,
  args: CliParsedArgs,
  allowed: readonly ('pkgName' | 'name')[],
) {
  const unexpected: string[] = [];
  if (args.pkgName !== undefined && !allowed.includes('pkgName')) unexpected.push('--pkgName');
  if (args.name !== undefined && !allowed.includes('name')) unexpected.push('--name');
  if (unexpected.length === 0) return;

  const flags = unexpected.join(', ');
  throw scaffoldArgError(`Template "${tmplName}" does not accept ${flags}.`, tmplName);
}

function scaffoldArgError(message: string, tmplName?: string): Error {
  return new Error(`${message}\nhint: ${dslCommand(tmplName)}`);
}

function dslCommand(tmplName?: string): string {
  return isTemplateName(tmplName) ? `${DslCommand} ${tmplName}` : DslCommand;
}

function isTemplateName(input: unknown): input is t.TemplateName {
  return Is.str(input) && TemplateNames.includes(input);
}

async function resolveCommitOptions(
  tmplName: t.TemplateName,
  targetDir: t.StringAbsoluteDir,
  options: SetupOptions,
): Promise<SetupOptions> {
  if (tmplName !== 'pkg' || options.pkgName) return options;

  const res = await Fs.readJson<{ readonly name?: string }>(Fs.join(targetDir, 'deno.json'));
  return { ...options, pkgName: res.data?.name };
}
