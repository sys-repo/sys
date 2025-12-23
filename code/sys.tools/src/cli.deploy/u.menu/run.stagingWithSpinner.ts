import { type t, pkg, c, Cli, Path, Pkg } from '../common.ts';
import { executeStaging, stagingConcurrencyDefault } from '../u.staging/mod.ts';
import { Fmt } from '../u.fmt.ts';
import { ensureRootIndexHtml } from './u.index.html.ts';

type RunStagingResult = { readonly ok: true } | { readonly ok: false; readonly error: unknown };

/**
 * Run executeStaging with a stable spinner UI.
 * Never throws unless you choose to rethrow based on ok:false.
 */
export async function runStagingWithSpinner(args: {
  cwd: t.StringDir;
  mappings: t.Ary<t.DeployTool.Staging.Mapping>;
  stagingRoot: t.StringRelativeDir;
}): Promise<RunStagingResult> {
  const { cwd, mappings } = args;

  const spin = Cli.spinner();
  spin.start(Fmt.spinnerText('Running staging...'));

  const active = new Map<number, string>();
  const total = mappings.length;
  let done = 0;

  const render = (): string => {
    const names = [...active.entries()].sort((a, b) => a[0] - b[0]).map(([, name]) => name);
    const lines: string[] = [];
    lines.push(`Staging (${c.white(String(done))}/${total})...`);

    for (const name of names) {
      lines.push(c.gray(c.dim(`  - ${name}`)));
    }

    return lines.join('\n');
  };

  const refresh = () => {
    spin.text = Fmt.spinnerText(render());
  };

  try {
    await executeStaging({
      cwd,
      mappings,
      stagingRoot: args.stagingRoot,
      concurrency: stagingConcurrencyDefault({ total }),
      cleanStagingRoot: true,
      writeDistJson: true,

      async onWriteDistJson(e) {
        const dir = e.stagingRoot;
        await ensureRootIndexHtml(cwd, dir);

        // Respect any dist.json produced by downstream builders
        const { exists } = await Pkg.Dist.load(dir);
        if (exists) return;

        // Otherwise, synthesize a root dist.json for deployment
        await Pkg.Dist.compute({
          save: true,
          dir,
          pkg,
          builder: pkg,
        });
      },

      onProgress(e) {
        if (e.kind === 'mapping:start') {
          active.set(e.index, Path.basename(e.source));
          refresh();
          return;
        }

        if (e.kind === 'mapping:done') {
          done += 1;
          active.delete(e.index);
          refresh();
          return;
        }

        if (e.kind === 'mapping:fail') {
          active.delete(e.index);
          refresh();
          return;
        }

        refresh();
      },
    });

    spin.succeed(Fmt.spinnerText('Staging complete'));
    return { ok: true };
  } catch (error) {
    spin.fail(Fmt.spinnerText('Staging failed'));
    return { ok: false, error };
  }
}
