/**
 * Retrieves a random unused port.
 */
export function randomPort(): number {
  // NB: attempting to listen on port 0 allows the OS to assign an available port.
  const listener = Deno.listen({ port: 0 });
  try {
    return listener.addr.port;
  } finally {
    listener.close(); // Immediately close.
  }
}
