import { type t, c, Cli, Fs, Is, Open, Path, Pkg, Str, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { Fmt } from '../u.fmt.ts';

import { ValidName } from './is.ts';
import { runPushWithSpinner } from './run.pushWithSpinner.ts';
import { runStagingWithSpinner } from './run.stagingWithSpinner.ts';
import { formatHashPrefix } from './u/u.formatHashPrefix.ts';
import { promptEndpointAction } from './u/u.promptEndpointAction.ts';
import { pushCapabilityOf } from './u/u.pushCapability.ts';
import { renderEndpointScreen } from './u/u.renderEndpointScreen.ts';
import { resolveMappingsForStaging } from './u/u.resolveMappingsForStaging.ts';
import { resolvePushStagingDir } from './u/u.resolvePushStagingDir.ts';

type Pick = { readonly kind: 'back' } | { readonly kind: 'deleted'; readonly key: string };

/**
 * Interactive menu for configuring a single deploy endpoint.
 *
 * Endpoint configuration is authored in YAML:
 *   ./-config/<pkg.name>/deploy/<name>.yaml
 *
 * This menu owns only:
 * - rename (file)
 * - delete (file)
 */
export async function endpointMenu(args: { cwd: t.StringDir; key: string }): Promise<Pick> {
  const { cwd } = args;
  let key = args.key;

  const dim = (s: string) => c.gray(c.dim(s));

  let ranOk = false;
  let pushedOk = false;

  while (true) {
    const yamlRel = `${EndpointsFs.dir}/${key}${EndpointsFs.ext}`;
    const yamlAbs = Fs.join(cwd, yamlRel);

    if (!(await Fs.exists(yamlAbs))) {
      await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));
      await EndpointsFs.ensureInitialYaml(yamlAbs, key);
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
    const stagingRootAbs = resolvePushStagingDir({ cwd, stagingRootRel });
    const mappingStagingRel = String(mapping?.dir?.staging ?? '').trim();
    const mappingStagingAbs = mappingStagingRel
      ? Path.resolve(stagingRootAbs, mappingStagingRel)
      : undefined;
    const rootDist = (await Pkg.Dist.load(stagingRootAbs)).dist;
    const mappingDist = mappingStagingAbs ? (await Pkg.Dist.load(mappingStagingAbs)).dist : undefined;
    const dist = rootDist?.hash?.digest
      ? rootDist
      : mappingDist?.hash?.digest
        ? mappingDist
        : rootDist ?? mappingDist;
    const digest = dist?.hash?.digest;
    const hashSuffix = digest ? String(digest).slice(-5) : undefined;
    const hashPrefix = formatHashPrefix(hashSuffix);
    const buildTime = dist?.build?.time;
    const stageAge = Is.num(buildTime) && digest ? Time.elapsed(buildTime).toString() : undefined;
    const stageSizeTotal = dist?.build?.size?.total;
    const stageSize = Is.num(stageSizeTotal) && digest ? Str.bytes(stageSizeTotal) : undefined;
    const hasStageMeta = !!(stageAge || stageSize);
    const pushUrl =
      provider?.kind === 'orbiter'
        ? String(provider.domain ?? '').trim()
          ? `https://${String(provider.domain ?? '').trim()}`
          : undefined
        : undefined;

    // "can push" is about capability + having *some* staging root configured ('.' counts).
    const canPush = capability.show && capability.enabled && !!stagingRootRel;

    const table = await Fmt.endpointTable(cwd, { name: key, file: yamlRel });
    console.info(renderEndpointScreen({ table: table.text, check }));

    const mappings = table.yaml?.mappings ?? [];
    if (mappings.length === 0) {
      const s = Str.builder()
        .indent(4, (s) => {
          s
            //
            .line(c.italic(c.yellow('No configuration mappings setup yet.')))
            .line(c.gray(`run ${c.green('config: edit')}`));
        })
        .blank();
      console.info(String(s));
    }

    const showPush = capability.show;
    const picked = await promptEndpointAction({
      checkOk: check.ok,
      ranOk,
      showPush,
      pushedOk,
      hashPrefix,
      stageAge,
      stageSize,
      pushUrl,
      hasStageMeta,
    });

    if (picked === 'back') return { kind: 'back' };

    if (picked === 'edit') {
      const openTarget = `./${Str.trimLeadingDotSlash(yamlRel)}`;
      Open.invokeDetached(cwd, openTarget, { silent: true });
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
        stagingDir: stagingRootAbs,
      });

      if (res.ok) {
        pushedOk = true;
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
      if (!yaml) continue;
      const resolved = await resolveMappingsForStaging({ cwd, yamlPath: yamlRel, yaml });
      if (!resolved.ok) continue;

      const sourceRootRel = String(yaml.source?.dir ?? '').trim() || '.';

      const res = await runStagingWithSpinner({
        cwd,
        mappings: resolved.mappings,
        sourceRoot: sourceRootRel,
        stagingRoot: stagingRootRel,
      });

      ranOk = res.ok;
      continue;
    }

    if (picked === 'fix') {
      const b = Str.builder()
        .line(c.yellow('Fix errors'))
        .line(c.gray(`file: ${c.dim(yamlRel)}`))
        .line()
        .line(c.gray('Edit the YAML, then re-open this endpoint menu.'));

      console.info(String(b));
      await Cli.Input.Text.prompt({ message: dim('Press enter to continue'), default: '' });
      continue;
    }

    if (picked === 'rename') {
      const raw = await Cli.Input.Text.prompt({
        message: 'Rename endpoint',
        default: key,
        validate(value) {
          const next = String(value ?? '').trim();
          if (!next) return 'Name required.';
          if (!ValidName.test(next)) return ValidName.hint;
          if (next === key) return true;
          const path = Fs.join(cwd, EndpointsFs.fileOf(next));
          return Fs.exists(path).then((exists) => (exists ? 'Name already exists.' : true));
        },
      });

      const nextName = raw.trim();
      if (nextName === key) return { kind: 'back' };

      const nextRel = EndpointsFs.fileOf(nextName);
      const nextAbs = Fs.join(cwd, nextRel);
      await Fs.ensureDir(Fs.dirname(nextAbs));
      await Fs.move(yamlAbs, nextAbs);

      key = nextName;
      ranOk = false;
      pushedOk = false;
      continue;
    }

    if (picked === 'delete') {
      const yes = await Cli.Input.Confirm.prompt({
        message: `Delete ${c.cyan(key)}?`,
        default: false,
      });

      if (!yes) continue;

      await Fs.remove(yamlAbs);
      return { kind: 'deleted', key };
    }
  }
}
