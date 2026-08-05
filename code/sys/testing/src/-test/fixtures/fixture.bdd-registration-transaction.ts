import { describe, it } from '@sys/testing';
import { BddMarker } from './u.bdd-markers.ts';

console.info(BddMarker.ready);
console.info(BddMarker.registrationTransaction);

const parent = describe('BDD fixture → transactional suite registration');
let escaped: ReturnType<typeof describe> | undefined;
let rejectionMessage = '';

try {
  const invalidRegistration = (() => {
    escaped = describe('escaped descendant');
    it.only('focused child from rejected registration', () => {
      console.info(BddMarker.registrationTransactionBody);
    });
    return { then() {} };
  }) as unknown as () => void;
  describe(parent, 'rejected child suite', invalidRegistration);
} catch (error) {
  rejectionMessage = error instanceof Error ? error.message : String(error);
}

const escapedSuite = escaped;
if (!escapedSuite) throw new Error('Rejected registration did not expose its descendant handle.');

let escapedHandleMessage = '';
try {
  it(escapedSuite, 'must not accept registrations', () => {
    console.info(BddMarker.registrationTransactionBody);
  });
} catch (error) {
  escapedHandleMessage = error instanceof Error ? error.message : String(error);
}

it(parent, 'rolls back registry and focus state', () => {
  if (!rejectionMessage.includes('Returning a thenable from "describe"')) {
    throw new Error(`Unexpected rejection: ${rejectionMessage}`);
  }
  if (!escapedHandleMessage.includes('Suite does not represent a registered test suite.')) {
    throw new Error(`Escaped handle remained registered: ${escapedHandleMessage}`);
  }
  console.info(BddMarker.registrationTransactionControl);
});
