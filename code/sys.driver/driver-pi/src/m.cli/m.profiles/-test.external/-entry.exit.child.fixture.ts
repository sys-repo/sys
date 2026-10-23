// A real process status producer; no Pi, provider, network, or filesystem state.
if (Deno.args[0] === 'wait') {
  console.info('fixture child ready');
  setInterval(() => {}, 1_000);
} else {
  Deno.exit(Deno.args[0] === 'failure' ? 37 : 0);
}
