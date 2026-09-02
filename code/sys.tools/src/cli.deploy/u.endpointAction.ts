import { c, Cli, Is, Path, Str, type t, Time } from './common.ts';
import { EndpointsFs } from './u.endpoints/mod.ts';
import { Fmt } from './u.fmt.ts';
import { runDeployPreviewSession } from './u.preview.ts';
import { loadStagePlan } from './u.stage.ts';
import { resolveStagingRoot } from './u.staging/mod.ts';

import { runPushWithSpinner } from './u.menu/run.pushWithSpinner.ts';
import { runStagingWithSpinner } from './u.menu/run.stagingWithSpinner.ts';
import { pushCapabilityOf } from './u.menu/u/u.pushCapability.ts';
import { PushPublishStats } from './u.push/u.publishStats.ts';
import { PushPruneStats } from './u.push/u.pruneStats.ts';

/**
 * Run one resolved Deploy endpoint action.
 */
export async function runEndpointAction(args: {
  cwd: t.StringDir;
  key: string;
  yamlPath: t.StringPath;
  action: t.DeployTool.Endpoint.RunAction;
  force?: boolean;
  until?: t.UntilInput;
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
    case 'preview':
      return await runPreviewAction(args);
  }
}

/** Helpers: */
async function runPushAction(args: {
  cwd: t.StringDir;
  yamlPath: t.StringPath;
  force?: boolean;
}): Promise<t.DeployTool.Endpoint.RunResult> {
  const { cwd, yamlPath } = args;
  const force = args.force === true;
  const yamlDisplay = displayYamlPath(cwd, yamlPath);
  const freshCheck = await EndpointsFs.validateYaml(yamlPath, { cwd });
  const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
  const freshCapability = await pushCapabilityOf({
    cwd,
    yamlPath: yamlDisplay,
    checkOk: freshCheck.ok,
    yaml: freshYaml,
  });
  if (!freshCapability.show) {
    printPushUnavailable(freshCapability.reason, freshCapability.hint);
    return { ok: false, push: { ok: false } };
  }

  if (!freshYaml) return { ok: false, push: { ok: false } };

  const freshStagingRootRel = String(freshYaml.staging.dir);
  const freshProvider = freshCapability.provider;
  const targets = freshCapability.targets;
  if (!targets.length) {
    const b = Str.builder()
      .line(c.yellow('Push skipped'))
      .line(c.gray(c.dim('No deploy targets resolved for this provider.')));
    console.info(String(b));
    return { ok: false, push: { ok: false } };
  }

  const pushStarted = Time.now.timestamp;
  let okCount = 0;
  let bytesTotal = 0;
  const publishStats: t.PushPublishStats[] = [];
  const pruneStats: t.PushPruneStats[] = [];

  for (const target of targets) {
    const res = await runPushWithSpinner({ cwd, target, force });
    if (!res.ok) {
      const hint = String(res.hint ?? '').trim();
      const mappingStagingRel = String(
        ((freshYaml.mappings ?? []).find((m) => m.mode === 'build+copy') ??
          (freshYaml.mappings ?? [])[0])?.dir
          ?.staging ?? '',
      );
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
    if (res.publish) publishStats.push(res.publish);
    if (res.prune) pruneStats.push(res.prune);
  }

  if (okCount !== targets.length) return { ok: false, push: { ok: false } };

  const elapsed = Time.elapsed(pushStarted).toString();
  const bytes = bytesTotal || undefined;
  const publish = PushPublishStats.merge(publishStats);
  const publishSummary = PushPublishStats.summary(publish);
  const reportDigest = publish?.files.find((file) => file.path === 'dist.json')?.digest;
  const hashSuffix = String(reportDigest ?? '').trim().slice(-5) || undefined;
  const prune = PushPruneStats.merge(pruneStats);
  const pruneSummary = PushPruneStats.summary(prune);
  const table = Cli.table();
  table.push([
    c.gray('  targets'),
    String(targets.length),
    c.italic(c.gray('total push targets')),
  ]);
  if (publishSummary.total > 0) {
    table.push([c.gray('  files'), publishSummary.total, c.italic(c.gray('total publish files'))]);
    table.push([
      c.gray('  uploaded'),
      publishSummary.written > 0 ? c.green(String(publishSummary.written)) : c.gray('0'),
      c.italic(c.gray(force ? 'forced files' : 'changed files')),
    ]);
    if (publishSummary.skipped > 0) {
      table.push([
        c.yellow('  skipped'),
        c.yellow(String(publishSummary.skipped)),
        c.italic(c.gray('unchanged files')),
      ]);
    }
  }
  if (pruneSummary.removed > 0) {
    table.push([
      c.yellow('  removed'),
      c.yellow(String(pruneSummary.removed)),
      c.italic(c.gray('stale files')),
    ]);
  }
  const reportHash = `#${hashSuffix ?? '00000'}`;
  const reportSuffix = c.gray(c.dim(`for ${reportHash}`));
  console.info(c.white(`\nPush report ${reportSuffix}`));
  console.info(Str.trimEdgeNewlines(String(table)));
  console.info();

  return {
    ok: true,
    push: { ok: true, elapsed, bytes, publish, prune },
  };
}

async function runStageAction(args: {
  cwd: t.StringDir;
  yamlPath: t.StringPath;
}): Promise<t.DeployTool.Endpoint.RunResult> {
  const loaded = await loadStagePlan({ cwd: args.cwd, config: args.yamlPath });
  if (!loaded.ok) return { ok: false, stageOk: false, error: loaded.error };

  const res = await runStagingWithSpinner(loaded.plan);
  return { ok: res.ok, stageOk: res.ok, error: res.ok ? undefined : res.error };
}

async function runPreviewAction(args: {
  cwd: t.StringDir;
  key: string;
  yamlPath: t.StringPath;
  until?: t.UntilInput;
}): Promise<t.DeployTool.Endpoint.RunResult> {
  const { cwd, key, yamlPath } = args;
  const freshCheck = await EndpointsFs.validateYaml(yamlPath, { cwd });
  const freshYaml = freshCheck.ok ? freshCheck.doc : undefined;
  if (!freshYaml) return { ok: false };

  const stagingRoot = resolveStagingRoot({
    cwd,
    stagingRootRel: String(freshYaml.staging.dir),
  });
  const result = await runDeployPreviewSession({
    cwd,
    dir: stagingRoot,
    name: key,
    port: freshYaml.staging.serve?.port,
    until: args.until,
  });
  if (!result.ok) {
    console.info(Fmt.previewUnavailable(result.reason));
    return { ok: false };
  }
  return { ok: true };
}

function displayYamlPath(cwd: t.StringDir, yamlPath: t.StringPath): t.StringPath {
  const relative = String(Path.relative(cwd, yamlPath));
  if (!relative.trim() || relative.startsWith('..')) return yamlPath;
  return `./${Str.trimLeadingDotSlash(relative)}`;
}

function printPushUnavailable(reason: string, hint?: string) {
  const text = String(hint ?? '').trim();
  const b = Str.builder()
    .line(c.yellow('Push unavailable'))
    .line(c.gray(c.dim(`reason: ${reason}`)));
  if (text) b.line(c.gray(text));
  console.info(String(b));
}
