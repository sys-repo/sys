import { type t, c, Cli, Fs, Is, Open, Path, Pkg, Str, Time } from '../common.ts';
import { D as ServeD } from '../../cli.serve/common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { runEndpointAction } from '../u.endpointAction.ts';
import { Fmt } from '../u.fmt.ts';

import { ValidName } from './is.ts';
import { formatHashPrefix } from './u/u.formatHashPrefix.ts';
import { promptEndpointAction } from './u/u.promptEndpointAction.ts';
import { pushCapabilityOf } from './u/u.pushCapability.ts';
import { renderEndpointScreen } from './u/u.renderEndpointScreen.ts';
import { resolvePushStagingDir } from './u/u.resolvePushStagingDir.ts';

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
    const stageAge = Is.num(buildTime) && digest
      ? formatStageAge(Time.elapsed(buildTime).msec)
      : undefined;
    const stageSizeTotal = dist?.build?.size?.total;
    const stageSize = Is.num(stageSizeTotal) && digest ? Str.bytes(stageSizeTotal) : undefined;
    const hasStageMeta = !!(stageAge || stageSize);
    const hasStagedOutput = !!digest;
    const servePort = Is.num(yaml?.staging?.serve?.port)
      ? yaml.staging.serve.port
      : ServeD.port;
    const pushUrl = provider?.kind === 'orbiter'
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
      servePort,
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

    if (picked === 'push') {
      const res = await runEndpointAction({ cwd, key, yamlPath: yamlAbs, action: 'push' });
      if (res.push?.ok) {
        pushedOk = true;
        pushElapsed = res.push.elapsed;
        pushShards = res.push.shards;
        pushBytes = res.push.bytes;
      }
      continue;
    }

    if (picked === 'stage') {
      const res = await runEndpointAction({ cwd, key, yamlPath: yamlAbs, action: 'stage' });
      ranOk = res.stageOk === true;
      continue;
    }

    if (picked === 'stage-push') {
      const res = await runEndpointAction({ cwd, key, yamlPath: yamlAbs, action: 'stage-push' });
      ranOk = res.stageOk === true;
      if (res.push?.ok) {
        pushedOk = true;
        pushElapsed = res.push.elapsed;
        pushShards = res.push.shards;
        pushBytes = res.push.bytes;
      }
      continue;
    }

    if (picked === 'serve') {
      await runEndpointAction({ cwd, key, yamlPath: yamlAbs, action: 'serve' });
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

function formatStageAge(msec: number): string {
  if (!Number.isFinite(msec) || msec < 0) return '';
  if (msec < STAGE_JUST_NOW_MSEC) return 'just now';
  return Time.Duration.create(msec).toString();
}
