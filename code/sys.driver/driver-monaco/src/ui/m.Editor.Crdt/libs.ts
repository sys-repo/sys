export async function importLibs() {
  const { A, Crdt } = await import('@sys/driver-automerge/ui');
  return { A, Crdt } as const;
}
