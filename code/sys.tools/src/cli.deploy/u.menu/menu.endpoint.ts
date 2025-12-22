import { type t, c, Cli, Fs, Open, Path, Str, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { Fmt } from '../u.fmt.ts';

import { runPushWithSpinner } from './run.pushWithSpinner.ts';
import { runStagingWithSpinner } from './run.stagingWithSpinner.ts';
import { promptEndpointAction } from './u.promptEndpointAction.ts';
import { pushCapabilityOf } from './u.pushCapability.ts';
import { renderEndpointScreen } from './u.renderEndpointScreen.ts';
import { resolveMappingsForStaging } from './u.resolveMappingsForStaging.ts';
import { touchEndpointLastUsed } from './u.touchEndpointLastUsed.ts';

type Pick =
  | { readonly kind: 'back' }
  | { readonly kind: 'renamed'; readonly from: string; readonly to: string }
  | { readonly kind: 'deleted'; readonly key: string };

/**
 * Interactive menu for configuring a single deploy endpoint.
 *
 * Endpoint configuration is authored in YAML:
 *   ./-endpoints/<name>.yaml
 *
 * This menu owns only:
 * - rename (file + config index)
 * - delete (file + config index)
 */
export async function endpointMenu(args: {
  readonly config: t.DeployTool.Config.File;
  readonly key: string;
}): Promise<Pick> {
  const { config } = args;
  let key = args.key;

  const dim = (s: string) => c.gray(c.dim(s));
  const find = (name: string) => (config.current.endpoints ?? []).find((e) => e.name === name);

  let ranOk = false;
  let pushedOk = false;

  while (true) {
    const ref = find(key);
    if (!ref) return { kind: 'back' };

    const cwd = Fs.dirname(config.fs.path);
    const abs = Fs.join(cwd, ref.file);

    if (!(await Fs.exists(abs))) {
      await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));
      await EndpointsFs.ensureInitialYaml(abs, ref.name);
    }

    const check = await EndpointsFs.validateYaml(abs);
    const capability = await pushCapabilityOf({ cwd, yamlAbs: abs, checkOk: check.ok });
    const yaml = check.ok ? check.doc : undefined;
    const provider = yaml?.provider;

    // Prefer first `build+copy` mapping; else first mapping.
    const mapping =
      (yaml?.mappings ?? []).find((m) => m.mode === 'build+copy') ?? (yaml?.mappings ?? [])[0];

    const stagingDirRel = String(yaml?.staging?.dir ?? '').trim();
    const stagingRootAbs = stagingDirRel ? Path.resolve(String(cwd), stagingDirRel) : '';
    const canPush = capability.show && capability.enabled && !!stagingRootAbs;

    const mappingStagingRel = String(mapping?.dir?.staging ?? '').trim();
    const mappingStagingAbs =
      stagingRootAbs && mappingStagingRel ? Path.resolve(stagingRootAbs, mappingStagingRel) : '';

    const table = await Fmt.endpointTable(cwd, ref);
    console.info(renderEndpointScreen({ table: table.text, check }));

    const mappings = table.yaml?.mappings ?? [];
    if (mappings.length === 0) {
      const s = Str.builder()
        .indent(4, (s) => {
          s
            //
            .line(c.italic(c.yellow('No configuration mappings setup yet.')))
            .line(c.gray(`run ${c.green('edit yaml')}`));
        })
        .blank();
      console.info(String(s));
    }

    const showPush = capability.show;
    const picked = await promptEndpointAction({
      checkOk: check.ok,
      ranOk,
      canPush: showPush,
      pushedOk,
    });

    if (picked === 'back') return { kind: 'back' };

    if (picked === 'edit') {
      Open.invokeDetached(cwd, String(Path.toFileUrl(abs)), { silent: true });
      continue;
    }

    if (picked === 'push') {
      if (!showPush) continue;

      if (!canPush) {
        const hint = String(capability.hint ?? '').trim();
        const b = Str.builder()
          .line(c.yellow('Push unavailable'))
          .line(c.gray(c.dim(`reason: ${String(capability.reason ?? 'probe-failed')}`)));

        if (hint) b.line(c.gray(hint));

        console.info(String(b));
        continue;
      }

      if (!provider) continue;

      const res = await runPushWithSpinner({ provider, stagingDir: stagingRootAbs });

      if (res.ok) {
        pushedOk = true;

        await touchEndpointLastUsed({ config, endpointName: ref.name });
        continue;
      }

      {
        const hint = String(res.hint ?? '').trim();
        const b = Str.builder()
          .line(c.red('Push failed'))
          .line(c.gray(c.dim(`provider: ${String(provider.kind)}`)))
          .line(c.gray(c.dim(`staging root: ${stagingDirRel || '.'}`)))
          .line(c.gray(c.dim(`mapping.staging: ${mappingStagingRel || '(none)'}`)))
          .blank();

        if (hint) b.line(c.gray(hint));

        console.info(String(b));
        continue;
      }
    }

    if (picked === 'stage') {
      const file = String(ref.file ?? '');
      const yamlAbs = Fs.join(cwd, file);
      const yamlDir = Fs.dirname(yamlAbs); // endpoint YAML folder

      const resolved = await resolveMappingsForStaging({ cwd, yamlAbs });
      if (!resolved.ok) continue;

      await runStagingWithSpinner({
        mappings: resolved.mappings,
        yamlDir,
        stagingRoot: stagingRootAbs,
      });
      ranOk = true;

      await touchEndpointLastUsed({ config, endpointName: ref.name });
      continue;
    }

    if (picked === 'fix') {
      const rel = ref.file;
      const b = Str.builder()
        .line(c.yellow('Fix errors'))
        .line(c.gray(`file: ${c.dim(rel)}`))
        .line()
        .line(c.gray('Edit the YAML, then re-open this endpoint menu.'));

      console.info(String(b));
      await Cli.Input.Text.prompt({ message: dim('Press enter to continue'), default: '' });
      continue;
    }

    if (picked === 'rename') {
      const exists = (name: string) =>
        (config.current.endpoints ?? []).some((e) => e.name === name);

      const raw = await Cli.Input.Text.prompt({
        message: 'Rename endpoint',
        default: ref.name,
        validate(value) {
          const next = String(value ?? '').trim();
          if (!next) return 'Name required.';
          if (next !== ref.name && exists(next)) return 'Name already exists.';
          return true;
        },
      });

      const nextName = raw.trim();
      if (nextName === ref.name) return { kind: 'back' };

      const fromRel = ref.file;
      const toRel = EndpointsFs.fileOf(nextName);

      const fromAbs = Fs.join(cwd, fromRel);
      const toAbs = Fs.join(cwd, toRel);

      await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));

      if (await Fs.exists(fromAbs)) {
        await Fs.move(fromAbs, toAbs);
      } else {
        await EndpointsFs.ensureInitialYaml(toAbs, nextName);
      }

      config.change((doc) => {
        const now = Time.now.timestamp;
        const current = doc.endpoints ?? [];
        const lastUsedAt = now;
        doc.endpoints = current.map((e) => {
          return e.name === ref.name ? { ...e, name: nextName, file: toRel, lastUsedAt } : e;
        });
      });

      await config.fs.save();

      const from = key;
      key = nextName;

      ranOk = false;
      pushedOk = false;
      return { kind: 'renamed', from, to: nextName };
    }

    if (picked === 'delete') {
      const yes = await Cli.Input.Confirm.prompt({
        message: `Delete ${c.cyan(ref.name)}?`,
        default: false,
      });

      if (!yes) continue;

      const abs = Fs.join(cwd, ref.file);
      await Fs.remove(abs);

      config.change((doc) => {
        const current = doc.endpoints ?? [];
        doc.endpoints = current.filter((e) => e.name !== ref.name);
      });

      await config.fs.save();
      return { kind: 'deleted', key: ref.name };
    }
  }
}
