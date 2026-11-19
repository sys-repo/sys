import { expect, type t } from '../../../-test.ts';
import type { FailureKind, Operation } from '../u/t.ts';
import { readBody } from '../u/u.body.ts';
import { isPolicyFailure } from '../u/u.failure.ts';
import { validateResponsePolicy } from '../u/u.input.ts';
import { createOperation } from '../u/u.operation.ts';
import type { BodyFixture } from './t.ts';
import { responsePolicy } from './u.fixture.ts';

const URL = 'https://example.test/resource';
const policy = validateResponsePolicy(responsePolicy(['https://example.test']));
if (!policy.ok) throw new Error('Expected valid test policy.');
const POLICY = policy.value;

/** Own one operation; tests retain their stream, progress callback, and event ordering. */
export function bodyFixture(): BodyFixture {
  const controller = new AbortController();
  const operation = createOperation(controller.signal, POLICY.timeout);
  const dispose = () => operation.dispose();
  return {
    controller,
    operation,
    timeout: POLICY.timeout,
    read(body, onProgress) {
      return readBody({
        operation,
        response: new Response(body),
        policy: POLICY,
        requestedUrl: URL,
        finalUrl: URL,
        onProgress,
      });
    },
    dispose,
    [Symbol.dispose]: dispose,
  };
}

/** Assert rejection identity and Fetch-owned classification; ordering stays in each test. */
export function expectPolicyFailure(
  result: t.TryResult<unknown>,
  operation: Operation,
  kind: FailureKind,
): void {
  expect(result.ok).to.eql(false);
  const failure = operation.terminal;
  expect(result.error).to.equal(failure);
  if (!isPolicyFailure(failure)) throw new Error('Expected policy failure.');
  expect(failure.policyFailure).to.eql(kind);
}
