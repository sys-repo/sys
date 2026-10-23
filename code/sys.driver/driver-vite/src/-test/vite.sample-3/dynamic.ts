export const marker = 'dynamic-chunk-loaded';

export async function disposalTrace() {
  const trace: string[] = [];
  const resource = (name: string) => ({
    [Symbol.dispose]() {
      trace.push(name);
    },
    async [Symbol.asyncDispose]() {
      await Promise.resolve();
      trace.push(`${name}:async`);
    },
  });

  {
    await using first = resource('first');
    using second = resource('second');
    void first;
    void second;
  }

  return trace;
}
