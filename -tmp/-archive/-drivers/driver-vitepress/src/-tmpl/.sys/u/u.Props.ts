type O = Record<string, unknown>;

/**
 * Helper for passing props between Vue and React.
 */
export const Props = {
  encode<P extends O>(props: P): string {
    const json = JSON.stringify(props);
    const binary = new TextEncoder().encode(json);
    return String(binary);
  },

  decode(encoded: string): O {
    if (typeof encoded !== 'string') return {};
    try {
      const binary = Uint8Array.from(encoded.split(','));
      const json = new TextDecoder().decode(binary);
      return JSON.parse(json);
    } catch (error) {
      return {};
    }
  },
} as const;
