import { c, Cli, Fs, Hash, Is, Json, Open, Str, type t } from '../common.ts';
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

/** Menu-local payload publication report, not document authentication or a live remote check. */
type Publication = Readonly<{
  configuration: string;
  contentDigest: string;
  elapsed?: string;
  bytes?: number;
}>;

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

const DEFAULT_DEPENDENCIES: EndpointMenuDependencies = Object.freeze({
  promptAction: promptEndpointAction,
  runAction: runEndpointAction,
});

/**
 * Manage one endpoint's YAML file and orchestrate staging, publication, and nested preview.
 * Creates missing configuration, renames/deletes files, and opens an external editor for edits.
 * Endpoint YAML lives at `./-config/@sys.tools.deploy/<name>.yaml`.
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

  let publication: Publication | undefined;
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
    const configuration = yaml ? Hash.sha256(Json.stringify(yaml)) : undefined;

    const capability = await pushCapabilityOf({
      cwd,
      yamlPath: yamlRel,
      checkOk: check.ok,
      yaml,
    });

    const provider = yaml?.provider;
    let preview: Awaited<ReturnType<typeof previewStatus>> | undefined;
    if (yaml) {
      const stagingRoot = resolveStagingRoot({
        cwd,
        stagingRootRel: String(yaml.staging.dir),
      });
      preview = await previewStatus(stagingRoot);
    }
    const verification = preview?.kind === 'verified' ? preview.evidence : undefined;
    const isStalePublication = publication &&
      (!capability.show || publication.configuration !== configuration ||
        publication.contentDigest !== verification?.content.digest);
    if (isStalePublication) {
      publication = undefined;
    }
    const digest = verification?.content.digest;
    const hashSuffix = digest ? String(digest).slice(-5) : undefined;
    const hashPrefix = formatHashPrefix(hashSuffix);
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
      pushedOk: publication !== undefined,
      pushElapsed: publication?.elapsed,
      pushBytes: publication?.bytes,
      hashPrefix,
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

    if (picked === 'push' || picked === 'stage-push') {
      publication = undefined;
      const res = await deps.runAction({ cwd, key, yamlPath: yamlAbs, action: picked });
      const manifests = res.push?.publish?.files.filter((file) => file.path === 'dist.json') ?? [];
      const contentDigest = manifests.length === 1 ? manifests[0].digest : undefined;
      // The manifest report carries payload identity, not a checksum of the manifest document.
      if (res.ok && res.push?.ok && configuration && contentDigest) {
        publication = Object.freeze({
          configuration,
          contentDigest,
          elapsed: res.push.elapsed,
          bytes: res.push.bytes,
        });
      }
      demarkNextRender = true;
      continue;
    }

    if (picked === 'stage') {
      publication = undefined;
      await deps.runAction({ cwd, key, yamlPath: yamlAbs, action: 'stage' });
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
      publication = undefined;
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
