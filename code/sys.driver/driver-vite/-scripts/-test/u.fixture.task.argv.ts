// Runtime-boundary fixture: report argv received from Deno's task shell without environment access.
console.info(JSON.stringify({ args: Deno.args }));
console.error('task-fixture-stderr');
