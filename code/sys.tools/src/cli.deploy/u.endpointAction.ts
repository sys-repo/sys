import { startServing } from '../cli.serve/m.server/mod.ts';
import { c, Cli, Is, Path, Pkg, Str, type t, Time, Url } from './common.ts';
import { EndpointsFs } from './u.endpoints/mod.ts';
import { DenoProvider } from './u.providers/mod.ts';

import { runPushWithSpinner } from './u.menu/run.pushWithSpinner.ts';
import { runStagingWithSpinner } from './u.menu/run.stagingWithSpinner.ts';
import { checkUpToDate } from './u.menu/u/u.checkUpToDate.ts';
import { pushCapabilityOf } from './u.menu/u/u.pushCapability.ts';
import { resolveMappingsForStaging } from './u.menu/u/u.resolveMappingsForStaging.ts';
import { resolveMissingStagingOutputs } from './u.menu/u/u.resolveMissingStagingOutputs.ts';
import { resolveOrbiterPushTargets } from './u.menu/u/u.resolveOrbiterPushTargets.ts';
import { resolvePushStagingDir } from './u.menu/u/u.resolvePushStagingDir.ts';
import { resolvePushTargets } from './u.menu/u/u.resolvePushTargets.ts';

export async function runEndpointAction(args: {
  cwd: t.StringDir;
  key: string;
  yamlPath: t.StringPath;
  action: t.DeployTool.Endpoint.RunAction;
}): Promise<t.DeployTool.Endpoint.RunResult> {
  switch (args.action) {
    case 'stage':
      return await runStageAction(args);
    case 'push':
      return await runPushAction(args);
    case 'stage-push': {
      const staged = await runStageAction(args);
      if (!staged.ok) return staged;

      const pushed = await runPushAction(args);
      return {
        ok: pushed.ok,
        stageOk: true,
        push: pushed.push,
        error: pushed.error,
      };
    }
    case 'serve':
      return await runServeAction(args);
  }
}

async function runPushAction(args: {
  cwd: t.StringDir;
  yamlPath: t.StringPath;
}): Promise<t.DeployTool.Endpoint.RunResult> {
  const { cwd, yamlPath } = args;
  const yamlDisplay = displayYamlPath(cwd, yamlPath);
  const freshCheck = await EndpointsFs.validateYaml(yamlPath);
  const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
  const freshCapability = await pushCapabilityOf({
    cwd,
    yamlPath: yamlDisplay as t.StringRelativeDir,
    checkOk: freshCheck.ok,
  });
  const freshProvider = freshYaml?.provider;
  const freshStagingRootRel = String(freshYaml?.staging?.dir ?? '').trim() || '.';

  if (!freshCapability.show) {
    printPushUnavailable(freshCapability.reason ?? 'probe-failed', freshCapability.hint);
    return { ok: false, push: { ok: false } };
  }

  const freshCanPush = freshCapability.enabled && !!freshStagingRootRel;
  if (!freshCanPush) {
    printPushUnavailable(freshCapability.reason ?? 'probe-failed', freshCapability.hint);
    return { ok: false, push: { ok: false } };
  }

  if (!freshProvider || !freshYaml) return { ok: false, push: { ok: false } };

  const plan = await resolvePushTargets({ cwd, yaml: freshYaml });
  const targets = plan.targets;
  if (!targets.length) {
    const b = Str.builder()
      .line(c.yellow('Push skipped'))
      .line(c.gray(c.dim('No deploy targets (missing provider.shards.siteIds).')));
    console.info(String(b));
    return { ok: false, push: { ok: false } };
  }

  const dist = await loadEndpointDist(cwd, freshYaml);
  const hashSuffix = String(dist?.hash?.digest ?? '').trim().slice(-5) || undefined;

  const pushStarted = Time.now.timestamp;
  let okCount = 0;
  let bytesTotal = 0;
  let skipped = 0;

  for (const target of targets) {
    const providerDomain = target.provider.kind === 'orbiter'
      ? String(target.provider.domain ?? '').trim()
      : '';
    const domainRaw = String(target.domain ?? providerDomain ?? '').trim();
    const domain = toHttpsUrl(domainRaw);

    if (domain && target.stagingDir) {
      const res = await checkUpToDate({ stagingDir: target.stagingDir, domain });
      if (res.ok) {
        console.info(`${c.gray('push skipped (up-to-date)')} ${c.white(domain)} ${c.gray('✔')}`);
        okCount += 1;
        skipped += 1;
        continue;
      }
    }

    const res = await runPushWithSpinner({ cwd, target });
    if (!res.ok) {
      const hint = String(res.hint ?? '').trim();
      const mappingStagingRel = String(
        ((freshYaml.mappings ?? []).find((m) => m.mode === 'build+copy') ??
          (freshYaml.mappings ?? [])[0])?.dir
          ?.staging ?? '',
      ).trim();
      const b = Str.builder()
        .line(c.red('Push failed'))
        .line(c.gray(c.dim(`provider: ${String(freshProvider.kind)}`)))
        .line(c.gray(c.dim(`staging root: ${freshStagingRootRel || '.'}`)))
        .line(c.gray(c.dim(`mapping.staging: ${mappingStagingRel || '(none)'}`)))
        .blank();

      if (hint) b.line(c.gray(hint));
      console.info(String(b));
      return { ok: false, push: { ok: false }, error: res.error };
    }

    okCount += 1;
    if (Is.num(res.bytes)) bytesTotal += res.bytes;
  }

  if (okCount !== targets.length || targets.length === 0) {
    return { ok: false, push: { ok: false } };
  }

  const elapsed = Time.elapsed(pushStarted).toString();
  const shards = targets.filter((t) => Is.num(t.shard)).length || undefined;
  const bytes = bytesTotal || undefined;
  const orbiterPlan = freshProvider.kind === 'orbiter'
    ? await resolveOrbiterPushTargets({ cwd, yaml: freshYaml })
    : undefined;
  const totalCount = orbiterPlan?.stats.total ?? plan.stats.total;
  const skippedTotal = skipped + (orbiterPlan?.stats.skippedShards ?? 0);
  const totalTargets = totalCount > 0
    ? skippedTotal === 0 ? c.green(String(totalCount)) : c.yellow(String(totalCount))
    : totalCount;
  const table = Cli.table();
  table.push([c.gray('  targets'), totalTargets, c.italic(c.gray('total push targets'))]);
  if (skipped) {
    table.push([c.yellow('  skipped'), c.yellow(String(skipped)), c.italic(c.gray('up-to-date'))]);
  }
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
  console.info(c.white(`\nPush Report ${reportSuffix}`));
  console.info(Str.trimEdgeNewlines(String(table)));
  console.info();

  return {
    ok: true,
    push: { ok: true, elapsed, shards, bytes },
  };
}

async function runStageAction(args: {
  cwd: t.StringDir;
  yamlPath: t.StringPath;
}): Promise<t.DeployTool.Endpoint.RunResult> {
  const { cwd, yamlPath } = args;
  const freshCheck = await EndpointsFs.validateYaml(yamlPath);
  const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
  if (!freshYaml) return { ok: false, stageOk: false };

  if (freshYaml.provider?.kind === 'deno') {
    const res = await DenoProvider.stage({ cwd, yaml: freshYaml });
    return { ok: res.ok, stageOk: res.ok, error: res.ok ? undefined : res.error };
  }

  const resolved = await resolveMappingsForStaging({
    cwd,
    yamlPath: displayYamlPath(cwd, yamlPath) as t.StringRelativeDir,
    yaml: freshYaml,
  });
  if (!resolved.ok) return { ok: false, stageOk: false };

  const sourceRootRel = String(freshYaml.source?.dir ?? '').trim() || '.';
  const stagingRootRel = String(freshYaml.staging?.dir ?? '').trim() || '.';
  const clearStaging = freshYaml.staging?.clear === true;
  const buildResetHtml = freshYaml.staging?.html?.buildReset === true;
  const indexBaseDomain = freshYaml.provider?.kind === 'orbiter'
    ? String(freshYaml.provider.domain ?? '').trim()
    : undefined;

  const res = await runStagingWithSpinner({
    cwd,
    mappings: resolved.mappings,
    sourceRoot: sourceRootRel,
    stagingRoot: stagingRootRel,
    clear: clearStaging,
    indexBaseDomain,
    buildResetHtml,
  });

  return { ok: res.ok, stageOk: res.ok, error: res.ok ? undefined : res.error };
}

async function runServeAction(args: {
  cwd: t.StringDir;
  key: string;
  yamlPath: t.StringPath;
}): Promise<t.DeployTool.Endpoint.RunResult> {
  const { cwd, key, yamlPath } = args;
  const freshCheck = await EndpointsFs.validateYaml(yamlPath);
  const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
  if (!freshYaml) return { ok: false };

  const freshStagingRootRel = String(freshYaml.staging?.dir ?? '').trim() || '.';
  const freshStagingRootAbs = resolvePushStagingDir({ cwd, stagingRootRel: freshStagingRootRel });
  const servePort = Is.num(freshYaml.staging?.serve?.port)
    ? freshYaml.staging.serve.port
    : undefined;
  const freshDist = (await Pkg.Dist.load(freshStagingRootAbs)).dist;
  if (!freshDist?.hash?.digest) {
    const missing = await resolveMissingStagingOutputs({
      cwd,
      yamlPath: displayYamlPath(cwd, yamlPath) as t.StringRelativeDir,
      yaml: freshYaml,
    });
    const suffix = missing.length ? `: ${missing.join(', ')}` : '';
    const b = Str.builder()
      .line(c.yellow('Serve unavailable'))
      .line(c.gray(c.dim(`reason: no-staging-output${suffix}`)))
      .line(c.gray('Run stage first, then serve.'));
    console.info(String(b));
    return { ok: false };
  }

  const location: t.ServeTool.LocationYaml.Location = {
    name: key,
    dir: freshStagingRootAbs,
  };
  await startServing(cwd, location, { host: 'local', port: servePort });
  return { ok: true };
}

function displayYamlPath(cwd: t.StringDir, yamlPath: t.StringPath): t.StringPath {
  const rel = Path.relative(cwd, yamlPath);
  if (!String(rel).trim() || String(rel).startsWith('..')) return yamlPath;
  return `./${Str.trimLeadingDotSlash(rel)}`;
}

async function loadEndpointDist(
  cwd: t.StringDir,
  yaml: t.DeployTool.Config.EndpointYaml.Doc,
): Promise<t.DistPkg | undefined> {
  const mapping = (yaml.mappings ?? []).find((m) => m.mode === 'build+copy') ??
    (yaml.mappings ?? [])[0];
  const stagingRootRel = String(yaml.staging?.dir ?? '').trim() || '.';
  const stagingRootAbs = resolvePushStagingDir({ cwd, stagingRootRel });
  const mappingStagingRel = String(mapping?.dir?.staging ?? '').trim();
  const mappingStagingAbs = mappingStagingRel
    ? Path.resolve(stagingRootAbs, mappingStagingRel)
    : undefined;
  const rootDist = (await Pkg.Dist.load(stagingRootAbs)).dist;
  const mappingDist = mappingStagingAbs ? (await Pkg.Dist.load(mappingStagingAbs)).dist : undefined;

  return rootDist?.hash?.digest
    ? rootDist
    : mappingDist?.hash?.digest
    ? mappingDist
    : (rootDist ?? mappingDist);
}

function printPushUnavailable(reason: string, hint?: string) {
  const text = String(hint ?? '').trim();
  const b = Str.builder()
    .line(c.yellow('Push unavailable'))
    .line(c.gray(c.dim(`reason: ${reason}`)));
  if (text) b.line(c.gray(text));
  console.info(String(b));
}

function toHttpsUrl(input: string): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  if (Is.urlString(raw)) return Url.normalize(raw);
  const noScheme = Str.trimHttpScheme(raw);
  const cleaned = Str.trimLeadingSlashes(noScheme);
  return Url.normalize(`https://${cleaned}`);
}
