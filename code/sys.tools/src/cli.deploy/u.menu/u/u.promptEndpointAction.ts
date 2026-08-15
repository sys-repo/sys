import { c, Cli, Fmt, Is, Str, type t } from './common.ts';

type A = t.DeployTool.Endpoint.Menu.Action;

export function formatServeActionName(port: number): string {
  return `  serve   ${c.gray(`port:${port}`)}`;
}

export function formatPushActionName(args: {
  readonly pushedOk: boolean;
  readonly hashPrefix: string;
  readonly pushElapsed?: string;
  readonly pushShards?: number;
  readonly pushBytes?: number;
  readonly pushUrl?: string;
}): string {
  const { pushedOk, hashPrefix, pushElapsed, pushShards, pushBytes, pushUrl } = args;
  const pushUrlMeta = pushedOk && pushUrl ? ` ${c.gray(c.dim('-'))} ${c.cyan(pushUrl)}` : '';
  const shardPart = pushedOk && pushShards
    ? `, ${pushShards} ${Str.plural(pushShards, 'shard')}`
    : '';
  const bytesPart = pushedOk && Is.num(pushBytes) ? `, ${Str.bytes(pushBytes)}` : '';
  const elapsedPart = pushedOk && pushElapsed
    ? `${pushElapsed}${shardPart}${bytesPart}`
    : undefined;
  const pushElapsedMeta = pushedOk && elapsedPart ? ` ${c.gray(c.dim(`(in ${elapsedPart})`))}` : '';
  const pushMeta = `${pushUrlMeta}${pushElapsedMeta}`;
  const pushPrefix = `  ${hashPrefix}  pushed ✔`;
  return pushedOk ? `${pushPrefix}${pushMeta}` : `  ${hashPrefix}  push`;
}

/**
 * Prompt for the next action in the endpoint menu.
 * Keeps the option-list rules centralized.
 */
type PromptEndpointActionArgs = {
  checkOk: boolean;
  ranOk: boolean;
  showPush: boolean;
  showStagePush: boolean;
  showServe: boolean;
  servePort: number;
  pushedOk: boolean;
  pushElapsed?: string;
  pushShards?: number;
  pushBytes?: number;
  hashPrefix: string;
  stageAge?: string;
  stageSize?: string;
  pushUrl?: string;
  hasStageMeta: boolean;
};

type SelectPrompt = (args: {
  readonly message: string;
  readonly options: { readonly name: string; readonly value: A }[];
  readonly hideDefault: boolean;
}) => Promise<A>;

export function promptEndpointAction(args: PromptEndpointActionArgs): Promise<A> {
  return promptEndpointActionWith(
    args,
    (input) => Cli.Input.Select.prompt<A>(input) as Promise<A>,
  );
}

/** Internal endpoint prompt runner with an explicit selection effect. */
export async function promptEndpointActionWith(
  args: PromptEndpointActionArgs,
  prompt: SelectPrompt,
): Promise<A> {
  const {
    checkOk,
    ranOk,
    showPush,
    showStagePush,
    showServe,
    servePort,
    pushedOk,
    hashPrefix,
    stageAge,
    stageSize,
    pushUrl,
    hasStageMeta,
    pushShards,
    pushBytes,
  } = args;
  const stageAgeText = stageAge
    ? ` ${c.gray(c.dim(stageAge === 'just now' ? `- ${stageAge}` : `- ${stageAge} ago`))}`
    : '';
  const stageSizeText = stageSize ? ` ${c.gray(c.dim(`| ${stageSize}`))}` : '';
  const stageMeta = `${stageAgeText}${stageSizeText}`;
  const stageLabel = pushedOk ? 'staged ✔' : hasStageMeta ? 'staged (rebuild)' : 'stage (build)';
  const stageName = `  ${hashPrefix}  ${stageLabel}${stageMeta}`;
  const pushName = formatPushActionName({
    pushedOk,
    hashPrefix,
    pushElapsed: args.pushElapsed,
    pushShards,
    pushBytes,
    pushUrl,
  });
  const stagePushName = `  ${c.dim(c.gray('-'.repeat(6)))}  stage + push`;
  const answer = await prompt({
    message: '',
    options: [
      ...(checkOk ? [{ name: stageName, value: 'stage' as const }] : []),
      ...(showPush ? [{ name: pushName, value: 'push' as const }] : []),
      ...(showStagePush ? [{ name: stagePushName, value: 'stage-push' as const }] : []),
      ...(showServe ? [{ name: formatServeActionName(servePort), value: 'serve' as const }] : []),
      ...(checkOk ? [] : [{ name: c.yellow('  fix errors'), value: 'fix' as const }]),
      { name: '  config: edit', value: 'edit' as const },
      { name: '  config: reload', value: 'reload' as const },
      { name: '  config: rename', value: 'rename' },
      { name: c.dim(c.gray(' (delete)')), value: 'delete' },
      { name: Fmt.back(), value: 'back' },
    ],
    hideDefault: true,
  });

  return answer as A;
}
