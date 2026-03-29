import { type t, c, Cli, Fs, Is, Open, Path, Pkg, Str, Time, Url } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { Fmt } from '../u.fmt.ts';
import { DenoProvider } from '../u.providers/mod.ts';
import { startServing } from '../../cli.serve/m.server/mod.ts';

import { ValidName } from './is.ts';
import { runPushWithSpinner } from './run.pushWithSpinner.ts';
import { runStagingWithSpinner } from './run.stagingWithSpinner.ts';
import { checkUpToDate } from './u/u.checkUpToDate.ts';
import { formatHashPrefix } from './u/u.formatHashPrefix.ts';
import { promptEndpointAction } from './u/u.promptEndpointAction.ts';
import { pushCapabilityOf } from './u/u.pushCapability.ts';
import { renderEndpointScreen } from './u/u.renderEndpointScreen.ts';
import { resolveMappingsForStaging } from './u/u.resolveMappingsForStaging.ts';
import { resolveOrbiterPushTargets } from './u/u.resolveOrbiterPushTargets.ts';
import { resolvePushStagingDir } from './u/u.resolvePushStagingDir.ts';
import { resolvePushTargets } from './u/u.resolvePushTargets.ts';

type Pick = { readonly kind: 'back' } | { readonly kind: 'deleted'; readonly key: string };
const STAGE_JUST_NOW_MSEC = 1000;

/**
 * Interactive menu for configuring a single deploy endpoint.
 *
 * Endpoint configuration is authored in YAML:
 *   ./-config/<pkg.name>.deploy/<name>.yaml
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
  let pushElapsed: string | undefined;
  let pushShards: number | undefined;
  let pushBytes: number | undefined;

  while (true) {
    const yamlRel = `${EndpointsFs.dir}/${key}${EndpointsFs.ext}`;
    const yamlAbs = Fs.join(cwd, yamlRel);

    if (!(await Fs.exists(yamlAbs))) {
      await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));
      await EndpointsFs.ensureInitialYaml(yamlAbs);
    }

    const check = await EndpointsFs.validateYaml(yamlAbs);
    const yaml = check.ok ? check.doc : undefined;

    const capability = await pushCapabilityOf({
      cwd,
      yamlPath: yamlRel,
      checkOk: check.ok,
      probe: false,
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
    const mappingDist = mappingStagingAbs
      ? (await Pkg.Dist.load(mappingStagingAbs)).dist
      : undefined;
    const dist = rootDist?.hash?.digest
      ? rootDist
      : mappingDist?.hash?.digest
        ? mappingDist
        : (rootDist ?? mappingDist);
    const digest = dist?.hash?.digest;
    const hashSuffix = digest ? String(digest).slice(-5) : undefined;
    const hashPrefix = formatHashPrefix(hashSuffix);
    const buildTime = dist?.build?.time;
    const stageAge =
      Is.num(buildTime) && digest ? formatStageAge(Time.elapsed(buildTime).msec) : undefined;
    const stageSizeTotal = dist?.build?.size?.total;
    const stageSize = Is.num(stageSizeTotal) && digest ? Str.bytes(stageSizeTotal) : undefined;
    const hasStageMeta = !!(stageAge || stageSize);
    const hasStagedOutput = !!digest;
    const pushUrl =
      provider?.kind === 'orbiter'
        ? String(provider.domain ?? '').trim()
          ? `https://${String(provider.domain ?? '').trim()}`
          : undefined
        : undefined;

    const showPush = capability.show;
    const showStagePush = check.ok && !!provider && provider.kind !== 'noop';

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

    const picked = await promptEndpointAction({
      checkOk: check.ok,
      ranOk,
      showPush,
      showStagePush,
      showServe: hasStagedOutput,
      pushedOk,
      pushElapsed,
      pushShards,
      pushBytes,
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

    const runPushAction = async (): Promise<boolean> => {
      const freshCheck = await EndpointsFs.validateYaml(yamlAbs);
      const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
      const freshCapability = await pushCapabilityOf({
        cwd,
        yamlPath: yamlRel,
        checkOk: freshCheck.ok,
      });
      const freshProvider = freshYaml?.provider;
      const freshStagingRootRel = String(freshYaml?.staging?.dir ?? '').trim() || '.';
      const freshCanPush = freshCapability.show && freshCapability.enabled && !!freshStagingRootRel;

      if (!freshCapability.show) return false;

      if (!freshCanPush) {
        const hint = String(freshCapability.hint ?? '').trim();
        const b = Str.builder()
          .line(c.yellow('Push unavailable'))
          .line(c.gray(c.dim(`reason: ${String(freshCapability.reason ?? 'probe-failed')}`)));
        if (hint) b.line(c.gray(hint));
        console.info(String(b));
        return false;
      }

      if (!freshProvider || !freshYaml) return false;

      const plan = await resolvePushTargets({ cwd, yaml: freshYaml });
      const targets = plan.targets;
      if (!targets.length) {
        const b = Str.builder()
          .line(c.yellow('Push skipped'))
          .line(c.gray(c.dim('No deploy targets (missing provider.shards.siteIds).')));
        console.info(String(b));
        return false;
      }

      const pushStarted = Time.now.timestamp;
      let okCount = 0;
      let bytesTotal = 0;
      let skipped = 0;
      for (const target of targets) {
        const providerDomain =
          target.provider.kind === 'orbiter' ? String(target.provider.domain ?? '').trim() : '';
        const domainRaw = String(target.domain ?? providerDomain ?? '').trim();
        const domain = toHttpsUrl(domainRaw);
        if (domain && target.stagingDir) {
          const res = await checkUpToDate({ stagingDir: target.stagingDir, domain });
          if (res.ok) {
            const line = `${c.gray('push skipped (up-to-date)')} ${c.white(domain)} ${c.gray('✔')}`;
            console.info(line);
            okCount += 1;
            skipped += 1;
            continue;
          }
        }

        const res = await runPushWithSpinner({
          cwd,
          target,
        });

        if (!res.ok) {
          const hint = String(res.hint ?? '').trim();
          const b = Str.builder()
            .line(c.red('Push failed'))
            .line(c.gray(c.dim(`provider: ${String(freshProvider.kind)}`)))
            .line(c.gray(c.dim(`staging root: ${freshStagingRootRel || '.'}`)))
            .line(c.gray(c.dim(`mapping.staging: ${mappingStagingRel || '(none)'}`)))
            .blank();

          if (hint) b.line(c.gray(hint));

          console.info(String(b));
          break;
        }

        okCount += 1;
        if (Is.num(res.bytes)) bytesTotal += res.bytes;
      }

      if (okCount === targets.length && targets.length > 0) {
        pushElapsed = Time.elapsed(pushStarted).toString();
        pushedOk = true;
        pushShards = targets.filter((t) => Is.num(t.shard)).length || undefined;
        pushBytes = bytesTotal || undefined;
        const orbiterPlan =
          freshProvider.kind === 'orbiter'
            ? await resolveOrbiterPushTargets({ cwd, yaml: freshYaml })
            : undefined;
        const totalCount = orbiterPlan?.stats.total ?? plan.stats.total;
        const skippedTotal = (skipped ?? 0) + (orbiterPlan?.stats.skippedShards ?? 0);
        const totalTargets =
          totalCount > 0
            ? skippedTotal === 0
              ? c.green(String(totalCount))
              : c.yellow(String(totalCount))
            : totalCount;
        const table = Cli.table();
        table.push([c.gray('  targets'), totalTargets, c.italic(c.gray('total push targets'))]);
        if (skipped)
          table.push([
            c.yellow('  skipped'),
            c.yellow(String(skipped)),
            c.italic(c.gray('up-to-date')),
          ]);
        if (orbiterPlan) {
          const stats = orbiterPlan.stats;
          table.push([c.gray('  root index'), stats.root, c.italic(c.gray('root index target'))]);
          table.push([c.gray('  shards'), stats.shard, c.italic(c.gray('shard targets'))]);
          if (stats.base) {
            table.push([c.gray('  non-shards'), stats.base, c.italic(c.gray('non-shard targets'))]);
          }
          if (stats.skippedShards) {
            table.push([
              c.yellow('  skipped'),
              c.yellow(String(stats.skippedShards)),
              c.italic(c.gray('missing shard output')),
            ]);
          }
        }
        const reportHash = `#${hashSuffix ?? '00000'}`;
        const reportSuffix = c.gray(c.dim(`for ${reportHash}`));
        const reportTitle = c.white(`\nPush Report ${reportSuffix}`);
        console.info(reportTitle);
        console.info(Str.trimEdgeNewlines(String(table)));
        console.info();
      }

      return okCount === targets.length && targets.length > 0;
    };

    const runStageAction = async (): Promise<boolean> => {
      // Re-read YAML at the moment of staging to capture edits made while menu is open.
      const freshCheck = await EndpointsFs.validateYaml(yamlAbs);
      const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
      if (!freshYaml) return false;

      if (freshYaml.provider?.kind === 'deno') {
        const res = await DenoProvider.stage({ cwd, yaml: freshYaml });
        ranOk = res.ok;
        return res.ok;
      }

      const resolved = await resolveMappingsForStaging({ cwd, yamlPath: yamlRel });
      if (!resolved.ok) return false;

      const sourceRootRel = String(freshYaml.source?.dir ?? '').trim() || '.';
      const stagingRootRel = String(freshYaml.staging?.dir ?? '').trim() || '.';
      const clearStaging = freshYaml.staging?.clear === true;
      const indexBaseDomain =
        freshYaml.provider?.kind === 'orbiter'
          ? String(freshYaml.provider.domain ?? '').trim()
          : undefined;

      const res = await runStagingWithSpinner({
        cwd,
        mappings: resolved.mappings,
        sourceRoot: sourceRootRel,
        stagingRoot: stagingRootRel,
        clear: clearStaging,
        indexBaseDomain,
      });

      ranOk = res.ok;
      return res.ok;
    };

    const runServeAction = async (): Promise<boolean> => {
      const freshCheck = await EndpointsFs.validateYaml(yamlAbs);
      const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
      if (!freshYaml) return false;

      const freshStagingRootRel = String(freshYaml.staging?.dir ?? '').trim() || '.';
      const freshStagingRootAbs = resolvePushStagingDir({
        cwd,
        stagingRootRel: freshStagingRootRel,
      });
      const freshDist = (await Pkg.Dist.load(freshStagingRootAbs)).dist;
      if (!freshDist?.hash?.digest) {
        const b = Str.builder()
          .line(c.yellow('Serve unavailable'))
          .line(c.gray(c.dim('reason: no-staging-output')))
          .line(c.gray('Run stage first, then serve.'));
        console.info(String(b));
        return false;
      }
      const location: t.ServeTool.LocationYaml.Location = {
        name: key,
        dir: freshStagingRootAbs,
      };
      await startServing(cwd, location, { host: 'local' });
      return true;
    };

    if (picked === 'push') {
      await runPushAction();
      continue;
    }

    if (picked === 'stage') {
      await runStageAction();
      continue;
    }

    if (picked === 'stage-push') {
      const staged = await runStageAction();
      if (staged) await runPushAction();
      continue;
    }

    if (picked === 'serve') {
      await runServeAction();
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
      pushElapsed = undefined;
      pushShards = undefined;
      pushBytes = undefined;
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

function toHttpsUrl(input: string): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  if (Is.urlString(raw)) return Url.normalize(raw);
  const noScheme = Str.trimHttpScheme(raw);
  const cleaned = Str.trimLeadingSlashes(noScheme);
  return Url.normalize(`https://${cleaned}`);
}

function formatStageAge(msec: number): string {
  if (!Number.isFinite(msec) || msec < 0) return '';
  if (msec < STAGE_JUST_NOW_MSEC) return 'just now';
  return Time.Duration.create(msec).toString();
}
