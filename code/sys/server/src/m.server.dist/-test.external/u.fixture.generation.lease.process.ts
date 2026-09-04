import { Args, Json, Process, type t } from './common.ts';

// Host argv is the fixture protocol input; `Args` owns its parsing semantics.
const argv = Args.parse(Deno.args, { stopEarly: true })._;
if (argv.length !== 1) throw new Error('Expected encoded Generation open arguments.');
const input = Json.parse<t.Dist.Generation.Open.Args>(argv[0]);
if (!input) throw new Error('Expected valid Generation open arguments.');

// Instrument the host listener capability itself so an accidental hosting path cannot hide behind
// a wrapper or a successful Generation settlement.
const serveDescriptor = Object.getOwnPropertyDescriptor(Deno, 'serve');
if (!serveDescriptor?.configurable) {
  throw new Error('Generation runtime proof cannot instrument Deno.serve.');
}
let listenerCalls = 0;
Object.defineProperty(Deno, 'serve', {
  configurable: true,
  enumerable: serveDescriptor.enumerable,
  writable: true,
  value() {
    listenerCalls += 1;
    throw new Error('Generation opening attempted to start a listener.');
  },
});

let owner: t.Dist.Generation.Owner | undefined;
try {
  const { Dist } = await import('../m.Dist.ts');
  const result = await Dist.Generation.open(input);
  if (result.kind !== 'opened') {
    const detail = result.generation
      ? `${result.generation.stage}/${result.generation.reason}`
      : result.reason;
    throw new Error(`Generation child failed: ${result.phase}/${detail}`);
  }
  owner = result.owner;
  Process.stdout.write(
    `GENERATION_ACQUIRED ${Json.stringify({ listenerCalls, store: owner.store }, 0)}\n`,
  );
  // `@sys/process` deliberately exposes no host-stdin capability; the parent owns this exact seam.
  await Deno.stdin.read(new Uint8Array(1));
  await owner.release();
} finally {
  Object.defineProperty(Deno, 'serve', serveDescriptor);
  try {
    await owner?.release();
  } catch {
    // Preserve the primary child-process settlement during best-effort release.
  }
}
