import { beforeAll, describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);

const suite = describe('BDD fixture → registration guard');
let message = '';
try {
  beforeAll(() => undefined);
} catch (error) {
  message = error instanceof Error ? error.message : String(error);
}

it(suite, 'rejects a top-level hook after registration', () => {
  if (!message.includes('Cannot add global hooks after')) throw new Error(message);
  console.info(BddMarker.registrationGuard);
});
