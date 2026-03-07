import { type t, c, Cli, Is, Str } from './common.ts';

type A = t.DeployTool.Endpoint.Menu.Action;

/**
 * Prompt for the next action in the endpoint menu.
 * Keeps the option-list rules centralized.
 */
export async function promptEndpointAction(args: {
  checkOk: boolean;
  ranOk: boolean;
  showPush: boolean;
  showStagePush: boolean;
  showServe: boolean;
  pushedOk: boolean;
  pushElapsed?: string;
  pushShards?: number;
  pushBytes?: number;
  hashPrefix: string;
  stageAge?: string;
  stageSize?: string;
  pushUrl?: string;
  hasStageMeta: boolean;
}): Promise<A> {
  const {
    checkOk,
    ranOk,
    showPush,
    showStagePush,
    showServe,
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
  const pushElapsed = args.pushElapsed;
  const pushUrlMeta = pushedOk && pushUrl ? ` ${c.gray(c.dim('-'))} ${c.cyan(pushUrl)}` : '';
  const shardPart =
    pushedOk && pushShards ? `, ${pushShards} ${Str.plural(pushShards, 'shard')}` : '';
  const bytesPart = pushedOk && Is.num(pushBytes) ? `, ${Str.bytes(pushBytes)}` : '';
  const elapsedPart =
    pushedOk && pushElapsed ? `${pushElapsed}${shardPart}${bytesPart}` : undefined;
  const pushElapsedMeta = pushedOk && elapsedPart ? ` ${c.gray(c.dim(`(in ${elapsedPart})`))}` : '';
  const pushMeta = `${pushUrlMeta}${pushElapsedMeta}`;
  const pushPrefix = `  ${hashPrefix}  pushed ✔`;
  const pushName = pushedOk ? `${pushPrefix}${pushMeta}` : `  ${hashPrefix}  push`;
  const hashIndent = ' '.repeat(`  ${hashPrefix}  `.length);
  const stagePushName = `  ${c.dim(c.gray('-'.repeat(6)))}  stage + push`;
  const answer = await Cli.Input.Select.prompt<A>({
    message: `Actions:`,
    options: [
      ...(checkOk ? [{ name: stageName, value: 'stage' as const }] : []),
      ...(showPush ? [{ name: pushName, value: 'push' as const }] : []),
      ...(showStagePush ? [{ name: stagePushName, value: 'stage-push' as const }] : []),
      ...(showServe ? [{ name: '  serve', value: 'serve' as const }] : []),
      ...(checkOk ? [] : [{ name: c.yellow('  fix errors'), value: 'fix' as const }]),
      { name: '  config: edit', value: 'edit' as const },
      { name: '  config: rename', value: 'rename' },
      { name: c.dim(c.gray(' (delete)')), value: 'delete' },
      { name: `${c.cyan('←')} back`, value: 'back' },
    ],
    hideDefault: true,
  });

  return answer as A;
}
