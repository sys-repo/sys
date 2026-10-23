import { Http } from '@sys/http/client';

const message = `@sys bridge http=${typeof Http}`;
const root = document.getElementById('root');
if (root) root.textContent = message;

export async function disposalTrace() {
  const trace: string[] = [];
  {
    await using first = {
      async [Symbol.asyncDispose]() {
        await Promise.resolve();
        trace.push('first:async');
      },
    };
    using second = { [Symbol.dispose]: () => trace.push('second') };
    void first;
    void second;
  }
  return trace;
}

console.info('sample-bridge', message);
console.info('sample-bridge-http', typeof Http);
