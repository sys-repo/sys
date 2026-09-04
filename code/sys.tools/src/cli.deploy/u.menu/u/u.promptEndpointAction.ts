import { c, Cli, Err, Fmt, Is, Str, type t } from './common.ts';

type EndpointAction = t.DeployTool.Endpoint.Menu.Action;
type ActionOption = { name: string; value: EndpointAction };

/** Inputs used to derive one endpoint action menu. */
type PromptEndpointActionArgs = {
  checkOk: boolean;
  showPush: boolean;
  showStagePush: boolean;
  showPreview: boolean;
  previewPort: number;
  pushedOk: boolean;
  pushElapsed?: string;
  pushBytes?: number;
  hashPrefix: string;
  stageAge?: string;
  stageSize?: string;
  pushUrl?: string;
  hasStageMeta: boolean;
};

type SelectPrompt = (args: {
  message: string;
  options: ActionOption[];
  hideDefault: boolean;
}) => Promise<string>;

/** Format the verified-preview action label. */
export function formatPreviewActionName(port: number): string {
  return `  preview ${c.gray(`port:${port}`)}`;
}

/** Format the endpoint push action label and settled publication metadata. */
export function formatPushActionName(args: {
  pushedOk: boolean;
  hashPrefix: string;
  pushElapsed?: string;
  pushBytes?: number;
  pushUrl?: string;
}): string {
  const { pushedOk, hashPrefix, pushElapsed, pushBytes, pushUrl } = args;
  if (!pushedOk) return `  ${hashPrefix}  push`;

  const url = pushUrl ? ` ${c.gray(c.dim('-'))} ${c.cyan(pushUrl)}` : '';
  const bytes = Is.num(pushBytes) ? `, ${Str.bytes(pushBytes)}` : '';
  const elapsed = pushElapsed ? ` ${c.gray(c.dim(`(in ${pushElapsed}${bytes})`))}` : '';
  return `  ${hashPrefix}  pushed ✔${url}${elapsed}`;
}

/**
 * Prompt for the next action in the endpoint menu.
 */
export function promptEndpointAction(args: PromptEndpointActionArgs): Promise<EndpointAction> {
  return promptEndpointActionWith(
    args,
    (input) => Cli.Input.Select.prompt<EndpointAction>(input),
  );
}

/** Internal endpoint prompt runner with an explicit selection effect. */
export async function promptEndpointActionWith(
  args: PromptEndpointActionArgs,
  prompt: SelectPrompt,
): Promise<EndpointAction> {
  const {
    checkOk,
    showPush,
    showStagePush,
    showPreview,
    previewPort,
    pushedOk,
    hashPrefix,
    stageAge,
    stageSize,
    pushUrl,
    hasStageMeta,
    pushBytes,
  } = args;

  let stageLabel = 'stage (build)';
  if (hasStageMeta) stageLabel = 'staged (rebuild)';
  if (pushedOk) stageLabel = 'staged ✔';

  const stageMeta = `${formatStageAgeText(stageAge)}${formatStageSizeText(stageSize)}`;
  const stageName = `  ${hashPrefix}  ${stageLabel}${stageMeta}`;
  const pushName = formatPushActionName({
    pushedOk,
    hashPrefix,
    pushElapsed: args.pushElapsed,
    pushBytes,
    pushUrl,
  });
  const stagePushName = `  ${c.dim(c.gray('-'.repeat(6)))}  stage + push`;

  const options: ActionOption[] = [];
  if (checkOk) options.push({ name: stageName, value: 'stage' });
  if (showPush) options.push({ name: pushName, value: 'push' });
  if (showStagePush) options.push({ name: stagePushName, value: 'stage-push' });
  if (showPreview) {
    options.push({ name: formatPreviewActionName(previewPort), value: 'preview' });
  }
  if (!checkOk) options.push({ name: c.yellow('  fix errors'), value: 'fix' });
  options.push(
    { name: '  config: edit', value: 'edit' },
    { name: '  config: reload', value: 'reload' },
    { name: '  config: rename', value: 'rename' },
    { name: c.dim(c.gray(' (delete)')), value: 'delete' },
    { name: Fmt.back(), value: 'back' },
  );

  const answer = await prompt({ message: '', options, hideDefault: true });
  const selected = options.find((option) => option.value === answer);
  if (!selected) throw Err.std(`Unexpected endpoint action: ${answer}`);
  return selected.value;
}

/** Helpers: */
function formatStageAgeText(stageAge?: string): string {
  if (!stageAge) return '';
  const suffix = stageAge === 'just now' ? '' : ' ago';
  return ` ${c.gray(c.dim(`- ${stageAge}${suffix}`))}`;
}

function formatStageSizeText(stageSize?: string): string {
  return stageSize ? ` ${c.gray(c.dim(`| ${stageSize}`))}` : '';
}
