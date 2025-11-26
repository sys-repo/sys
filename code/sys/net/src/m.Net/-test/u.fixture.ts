/**
 * Test fixtures for @sys/net.
 */
export const Fixture = {
  /**
   * Create a minimal fake WebSocket for testing.
   */
  makeFakeWebSocket(url: string) {
    const target = new EventTarget();
    return {
      url,
      readyState: 0,
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
    };
  },
} as const;
