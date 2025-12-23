import { type t, c, Cli, Fs, Open, Str } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { Fmt } from '../u.fmt.ts';

import { ValidName } from './is.ts';
import { runPushWithSpinner } from './run.pushWithSpinner.ts';
import { runStagingWithSpinner } from './run.stagingWithSpinner.ts';
import { promptEndpointAction } from './u/u.promptEndpointAction.ts';
import { pushCapabilityOf } from './u/u.pushCapability.ts';
import { renameEndpoint } from './u/u.renameEndpoint.ts';
import { renderEndpointScreen } from './u/u.renderEndpointScreen.ts';
import { resolveMappingsForStaging } from './u/u.resolveMappingsForStaging.ts';
import { touchEndpointLastUsed } from './u/u.touchEndpointLastUsed.ts';

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
  cwd: t.StringDir;
  config: t.DeployTool.Config.File;
  key: string;
}): Promise<Pick> {
  const { cwd, config } = args;
  let key = args.key;

  const dim = (s: string) => c.gray(c.dim(s));
  const find = (name: string) => (config.current.endpoints ?? []).find((e) => e.name === name);

  let ranOk = false;
  let pushedOk = false;

  while (true) {
    const ref = find(key);
    if (!ref) return { kind: 'back' };

    const yamlRel = String(ref.file ?? '').trim();
    const yamlAbs = Fs.join(cwd, yamlRel);

    if (!(await Fs.exists(yamlAbs))) {
      await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));
      await EndpointsFs.ensureInitialYaml(yamlAbs, ref.name);
    }

    const check = await EndpointsFs.validateYaml(yamlAbs);
    const yaml = check.ok ? check.doc : undefined;

    const capability = await pushCapabilityOf({
      cwd,
      yamlPath: yamlRel,
      checkOk: check.ok,
    });

    const provider = yaml?.provider;

    // Prefer first `build+copy` mapping; else first mapping.
    const mapping =
      (yaml?.mappings ?? []).find((m) => m.mode === 'build+copy') ?? (yaml?.mappings ?? [])[0];

    const stagingRootRel = String(yaml?.staging?.dir ?? '').trim() || '.';
    const mappingStagingRel = String(mapping?.dir?.staging ?? '').trim();

    // "can push" is about capability + having *some* staging root configured ('.' counts).
    const canPush = capability.show && capability.enabled && !!stagingRootRel;

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
      Open.invokeDetached(cwd, yamlRel, { silent: true });
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

      const res = await runPushWithSpinner({
        cwd,
        provider,
        stagingDir: stagingRootRel,
      });

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
          .line(c.gray(c.dim(`staging root: ${stagingRootRel || '.'}`)))
          .line(c.gray(c.dim(`mapping.staging: ${mappingStagingRel || '(none)'}`)))
          .blank();

        if (hint) b.line(c.gray(hint));

        console.info(String(b));
        continue;
      }
    }

    if (picked === 'stage') {
      const resolved = await resolveMappingsForStaging({ cwd, yamlPath: yamlRel });
      if (!resolved.ok) continue;

      await runStagingWithSpinner({
        cwd,
        mappings: resolved.mappings,
        stagingRoot: stagingRootRel,
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
          if (!ValidName.test(next)) return ValidName.hint;
          if (next !== ref.name && exists(next)) return 'Name already exists.';
          return true;
        },
      });

      const nextName = raw.trim();
      if (nextName === ref.name) return { kind: 'back' };

      const res = await renameEndpoint({ cwd, config, ref, nextName });
      if (!res.ok) {
        const b = Str.builder()
          .line(c.red('Rename failed'))
          .line(c.gray(c.dim(String(res.error))))
          .blank();
        console.info(String(b));
        continue;
      }

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

      await Fs.remove(yamlAbs);

      config.change((doc) => {
        const current = doc.endpoints ?? [];
        doc.endpoints = current.filter((e) => e.name !== ref.name);
      });

      await config.fs.save();
      return { kind: 'deleted', key: ref.name };
    }
  }
}
