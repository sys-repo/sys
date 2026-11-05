// Keep the launcher graph narrow; the module's common runtime barrel also loads Vite tooling.
import { Env } from '@sys/fs/env';
import { Path } from '@sys/fs/path';
import type { Env as TEnv } from '@sys/fs/t';
import { Process } from '@sys/process/process';
import { Obj } from '@sys/std/obj';

const CWD = Path.fromFileUrl(new URL('../', import.meta.url));

/** File membership is owned here, once. Optional lanes do not change the routine partition. */
export const lanes = {
  'entry:process': [
    './src/-entry/-test.external/-graph.process.ts',
    './src/-entry/-test.external/-serve.cached.process.ts',
  ],
  candidate: ['./src/m.vite/-test.external/-candidate-consumer.ts'],
  build: [
    './src/m.vite/-test/-build.test.ts',
    './src/m.vite/-test/-build.workspace-composition.test.ts',
    './src/m.vite/-test/-build.transitive-jsr.test.ts',
    './src/m.vite/-test/-build.failure-causes.test.ts',
    './src/m.vite/-test/-build.startup.test.ts',
    './src/m.vite/-test/-published-fixture-lifecycle.test.ts',
  ],
  bridge: [
    './src/m.vite/-test/-bootstrap.handoff.test.ts',
    './src/m.vite/-test/-bridge.integration.test.ts',
  ],
  dev: ['./src/m.vite/-test/-dev.test.ts'],
  'config:process': [
    './src/m.vite.config/-test/-fromFile.test.ts',
    './src/m.vite.config/-test/-serverFs.test.ts',
  ],
  graph: ['./src/m.vite.plugins/m.OptimizeImports/-test/-u.graph-proof.test.ts'],
  loader: ['./src/m.vite.transport/-test/-loader.npm.proof.ts'],
  'integrity:build': ['./src/m.vite.plugins/m.HtmlIntegrity/-test/-html-integrity.build.test.ts'],
  'dist:pipeline': ['./src/m.vite/-test.external/-dist.pipeline.ts'],
  external: ['./src/m.vite/-test.external/mod.ts'],
  'integrity:apps': ['./src/m.vite/-test.external/-html-integrity.apps.ts'],
  integrity: [
    './src/m.vite.plugins/-test',
    './src/m.vite.plugins/m.HtmlIntegrity/-test',
    './src/m.vite/-test.external/-html-integrity.chromium.ts',
  ],
} as const satisfies Readonly<Record<string, readonly string[]>>;

type Lane = keyof typeof lanes;

/** Preserve the existing sequential proof order, independently of optional lane membership. */
export const proofs = [
  'entry:process',
  'candidate',
  'build',
  'bridge',
  'dev',
  'config:process',
  'graph',
  'loader',
  'integrity:build',
] as const satisfies readonly Lane[];

/** Plan argv only: no shell parsing, filesystem discovery, or process effects. */
export function commands(input: readonly string[]): readonly string[][] {
  const [name, ...tail] = input;
  const selected = proofs.flatMap((lane) => [...lanes[lane]]);
  const laneCommand = (lane: Lane, extra: readonly string[] = []) => [
    'task',
    'test:run',
    '--trace-leaks',
    ...lanes[lane],
    ...extra,
  ];

  if (name === 'proofs') {
    // Deno task appends arguments to the last command of an && chain, not every command.
    return proofs.map((lane, index) => laneCommand(lane, index === proofs.length - 1 ? tail : []));
  }
  if (name === 'unit') {
    const ignored = selected.filter((path) => path.endsWith('.test.ts'));
    // No explicit paths: retain Deno's default discovery, including -scripts tests.
    return [['task', 'test:run', `--ignore=${ignored.join(',')}`, ...tail]];
  }
  if (name === 'cache') {
    return [[
      'test',
      '--no-run',
      '--node-modules-dir=auto',
      '-P=test',
      '--frozen',
      '--no-prompt',
      './src',
      './-scripts',
      ...selected.filter((path) => !path.endsWith('.test.ts')),
      ...tail,
    ]];
  }
  if (name && Obj.hasOwn(lanes, name)) return [laneCommand(name as Lane, tail)];
  throw new TypeError(`Unknown test lane: ${name ?? '(missing)'}`);
}

/** Await each inherited child and return its exact first nonzero status. */
export async function run(
  input: readonly string[],
  inherit = Process.inherit,
  environment?: TEnv.Reader,
): Promise<number> {
  const plan = commands(input);
  const env = environment ?? await Env.load({ search: 'none' });
  for (const args of plan) {
    const result = await inherit({
      cwd: CWD,
      args,
      clearEnv: false,
      // Preserve an explicit host color setting over Process.inherit's default of 1.
      // Process-only lookup must not introduce dotenv overrides into task execution.
      env: { FORCE_COLOR: env.has('FORCE_COLOR') ? env.get('FORCE_COLOR') : '1' },
    });
    if (result.code !== 0) return result.code;
  }
  return 0;
}

// Only the executable entry is runtime-specific; planning and execution use @sys owners.
if (import.meta.main) Deno.exitCode = await run(Deno.args);
