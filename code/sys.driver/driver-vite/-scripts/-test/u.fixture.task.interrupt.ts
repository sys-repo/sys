// Native signal fixture, executed only by the existing privileged test:run lane.
// Signal only this fixture's own process; no process-group or ambient PID cleanup.
Deno.test('task interruption fixture', () => {
  Deno.kill(Deno.pid, 'SIGINT');
});
