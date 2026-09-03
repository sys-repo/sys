import { c, Cli, Fs, Is, Num, Open, Str, type t, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { DEPLOY_PREVIEW_PORT, runEndpointAction } from '../u.endpointAction.ts';
import { Fmt } from '../u.fmt.ts';
import { resolveStagingRoot } from '../u.staging/mod.ts';

import { ValidName } from './is.ts';
import { formatHashPrefix } from './u/u.formatHashPrefix.ts';
import { promptEndpointAction } from './u/u.promptEndpointAction.ts';
import { pushCapabilityOf } from './u/u.pushCapability.ts';
import { previewStatus } from './u/u.previewStatus.ts';
import { renderEndpointScreen } from './u/u.renderEndpointScreen.ts';

type EndpointMenuArgs = { cwd: t.StringDir; key: string };
type EndpointMenuResult =
  | { readonly kind: 'back' }
  | { readonly kind: 'closed' }
  | { readonly kind: 'deleted'; readonly key: string };

/** Internal endpoint-menu dependency seam. */
export type EndpointMenuDependencies = {
  promptAction: typeof promptEndpointAction;
  runAction: typeof runEndpointAction;
};

const STAGE_JUST_NOW_MSEC = 1000;
const DEFAULT_DEPENDENCIES: EndpointMenuDependencies = Object.freeze({
  promptAction: promptEndpointAction,
  runAction: runEndpointAction,
});

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
export function endpointMenu(args: EndpointMenuArgs): Promise<EndpointMenuResult> {
  return endpointMenuWith(args, DEFAULT_DEPENDENCIES);
}

/** Internal endpoint-menu owner with an explicit action-prompt effect. */
export async function endpointMenuWith(
  args: EndpointMenuArgs,
  deps: EndpointMenuDependencies,
): Promise<EndpointMenuResult> {
  const { cwd } = args;
  let key = args.key;

  const dim = (s: string) => c.gray(c.dim(s));

  let pushedOk = false;
  let pushElapsed: string | undefined;
  let pushBytes: number | undefined;
  let demarkNextRender = false;

  while (true) {
    const yamlRel = `${EndpointsFs.dir}/${key}${EndpointsFs.ext}`;
    const yamlAbs = Fs.join(cwd, yamlRel);

    if (!(await Fs.exists(yamlAbs))) {
      await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));
      await EndpointsFs.ensureInitialYaml(yamlAbs);
    }

    const check = await EndpointsFs.validateYaml(yamlAbs, { cwd });
    const yaml = check.ok ? check.doc : undefined;

    const capability = await pushCapabilityOf({
      cwd,
      yamlPath: yamlRel,
      checkOk: check.ok,
      yaml,
    });

    const provider = yaml?.provider;
    const preview = yaml
      ? await previewStatus(resolveStagingRoot({
        cwd,
        stagingRootRel: String(yaml.staging.dir),
      }))
      : undefined;
    const verification = preview?.kind === 'verified' ? preview.evidence : undefined;
    const digest = verification?.dist.hash.digest;
    const hashSuffix = digest ? String(digest).slice(-5) : undefined;
    const hashPrefix = formatHashPrefix(hashSuffix);
    const buildTime = verification?.dist.build.time;
    const stageAge = Is.num(buildTime) && digest
      ? formatStageAge(Time.elapsed(buildTime).msec)
      : undefined;
    const stageSize = verification ? Str.bytes(verification.assets.totalBytes) : undefined;
    const hasStageMeta = verification !== undefined;
    const previewPort = Is.num(yaml?.staging.serve?.port)
      ? yaml.staging.serve.port
      : DEPLOY_PREVIEW_PORT;
    const pushUrl = provider?.kind === 'r2'
      ? String(provider.readOrigin ?? '').trim() || undefined
      : undefined;

    const showPush = capability.show;
    const showStagePush = check.ok && provider !== undefined && provider.kind !== 'noop';

    const table = await Fmt.endpointTable(cwd, { name: key, file: yamlRel }, {
      yaml,
      verification,
    });
    if (demarkNextRender) console.info(c.gray(Cli.Fmt.hr()));
    demarkNextRender = false;
    console.info(renderEndpointScreen({
      table: table.text,
      check,
      previewReason: preview?.kind === 'unavailable' ? preview.reason : undefined,
    }));

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

    const picked = await deps.promptAction({
      checkOk: check.ok,
      showPush,
      showStagePush,
      showPreview: verification !== undefined,
      previewPort,
      pushedOk,
      pushElapsed,
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
      demarkNextRender = true;
      continue;
    }

    if (picked === 'reload') {
      demarkNextRender = true;
      continue;
    }

    if (picked === 'push') {
      const res = await runEndpointAction({ cwd, key, yamlPath: yamlAbs, action: 'push' });
      if (res.push?.ok) {
        pushedOk = true;
        pushElapsed = res.push.elapsed;
        pushBytes = res.push.bytes;
      }
      demarkNextRender = true;
      continue;
    }

    if (picked === 'stage') {
      await runEndpointAction({ cwd, key, yamlPath: yamlAbs, action: 'stage' });
      demarkNextRender = true;
      continue;
    }

    if (picked === 'stage-push') {
      const res = await runEndpointAction({ cwd, key, yamlPath: yamlAbs, action: 'stage-push' });
      if (res.push?.ok) {
        pushedOk = true;
        pushElapsed = res.push.elapsed;
        pushBytes = res.push.bytes;
      }
      demarkNextRender = true;
      continue;
    }

    if (picked === 'preview') {
      const res = await deps.runAction({ cwd, key, yamlPath: yamlAbs, action: 'preview' });
      if (res.preview?.kind === 'closed') return { kind: 'closed' };
      demarkNextRender = true;
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
      demarkNextRender = true;
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
      pushedOk = false;
      pushElapsed = undefined;
      pushBytes = undefined;
      demarkNextRender = true;
      continue;
    }

    if (picked === 'delete') {
      const yes = await Cli.Input.Confirm.prompt({
        message: `Delete ${c.cyan(key)}?`,
        default: false,
      });

      if (!yes) {
        demarkNextRender = true;
        continue;
      }

      await Fs.remove(yamlAbs);
      return { kind: 'deleted', key };
    }
  }
}

/** Helpers: */
function formatStageAge(msec: number): string {
  if (!Num.Is.finite(msec) || msec < 0) return '';
  if (msec < STAGE_JUST_NOW_MSEC) return 'just now';
  return Time.Duration.create(msec).toString();
}
