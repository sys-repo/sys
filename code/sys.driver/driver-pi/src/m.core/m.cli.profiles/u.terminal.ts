export function clearInteractiveScreen() {
  if (Deno.stdout.isTerminal()) console.clear();
}
