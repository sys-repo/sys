/**
 * Published-boundary performance harness for external driver-vite comparison.
 */
import { Fs, Path } from './common.ts';
import { Perf, type PerfRun } from '../src/m.vite/-test.external/u.fixture.perf.ts';

export async function main() {
  const args = parseArgs(Deno.args);
  const result = await Perf.run({
    scenario: args.scenario,
    runs: args.runs,
  });
  const path = await writeResult(result);

  print(result, path);

  if (args.strict && result.samples.some((sample) => !sample.ok)) {
    Deno.exit(1);
  }
}

function parseArgs(args: readonly string[]) {
  const runs = args.find((arg) => arg.startsWith('--runs='));
  const scenario = args.find((arg) => arg.startsWith('--scenario='));
  return {
    runs: runs ? Number(runs.replace('--runs=', '')) : 3,
    scenario: (scenario?.replace('--scenario=', '') ?? 'published-baseline') as 'published-baseline',
    strict: args.includes('--strict'),
  };
}

async function writeResult(result: PerfRun) {
  const dir = Path.join(Fs.cwd(), '.tmp', 'perf');
  await Fs.ensureDir(dir);
  const path = Path.join(dir, `${result.phase.replace(/\//g, '.')}.${result.scenario}.json`);
  await Deno.writeTextFile(path, `${JSON.stringify(result, null, 2)}\n`);
  return path;
}

function print(result: PerfRun, path: string) {
  console.info('driver-vite perf harness');
  console.info(` phase:    ${result.phase}`);
  console.info(` scenario: ${result.scenario}`);
  console.info(` runs:     ${result.runs}`);
  console.info(` artifact: ${path}`);
  console.info(` note:     ${result.deliveryIdentityNote}`);
  console.info('');

  for (const sample of result.samples) {
    console.info(
      [
        `${sample.kind.padEnd(5)}`,
        `${sample.posture.padEnd(4)}`,
        `#${String(sample.index).padStart(2, '0')}`,
        sample.ok ? 'ok ' : 'bad',
        `${sample.elapsed}ms`,
        sample.detail.split('\n')[0],
      ].join('  '),
    );
  }
}

if (import.meta.main) await main();
