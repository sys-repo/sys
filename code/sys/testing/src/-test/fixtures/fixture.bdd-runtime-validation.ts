import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

let message = '';
try {
  const register = describe as unknown as (...args: unknown[]) => unknown;
  register('invalid options', { retries: 2 }, () => undefined);
} catch (error) {
  message = error instanceof Error ? error.message : String(error);
}

describe('BDD fixture → runtime option validation', () => {
  it('rejects unknown options defensively', () => {
    if (!message.includes('Unknown suite option: retries.')) throw new Error(message);
    console.info(BddMarker.runtimeValidation);
  });
});
