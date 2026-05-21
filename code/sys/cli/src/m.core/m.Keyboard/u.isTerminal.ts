export function isTerminal(): boolean {
  try {
    return Deno.stdin.isTerminal();
  } catch {
    return false;
  }
}
