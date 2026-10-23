import {
  createFixtureRoot,
  generateFixture,
  isHelp,
  parseArgs,
  printDryRunComplete,
  printError,
  printHelp,
  printPlan,
  printProbeResult,
  printStateCommitSuggestion,
  probePublished,
  readCommittedProbeState,
  readProbeState,
  runDeno,
  type RunInput,
  statePath,
  writeProbeState,
} from './task.probe.jsr.u.ts';

export async function main(input: RunInput = {}) {
  const argv = input.argv ?? Deno.args;
  if (isHelp(argv)) return printHelp();

  const fixtureRoot = await createFixtureRoot(input);
  const path = statePath(input);
  const state = await readProbeState(path);
  const args = parseArgs(argv, fixtureRoot, state, path);

  printPlan(args);
  const dir = await generateFixture(args);

  await runDeno(['publish', '--dry-run'], dir);
  if (!args.publish) return printDryRunComplete();

  await runDeno(['publish'], dir);
  await writeProbeState(args);

  const result = await probePublished(args);
  printProbeResult(result);
  const committed = await readCommittedProbeState(path);
  printStateCommitSuggestion(committed ?? state, args, result.status);
  if (result.status !== 'OK') Deno.exit(1);
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    printError(err);
    Deno.exit(1);
  }
}
