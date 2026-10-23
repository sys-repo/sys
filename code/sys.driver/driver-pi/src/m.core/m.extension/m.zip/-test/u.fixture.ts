import { Fs } from '@sys/fs';
import { isGuardFailure } from '../u/u.guard.ts';
import { expect, Is } from './common.ts';
export { context } from './u.fixture.context.ts';

/** Own one temporary root until all work in the callback has settled. */
export async function withRoot(run: (root: string) => Promise<void>) {
  const root = (await Fs.makeTempDir({ prefix: 'pi.zip.' })).absolute;
  try {
    await run(root);
  } finally {
    await Fs.remove(root);
  }
}

/** Assert a bounded thrown error, never an isError-shaped success. */
export async function rejection(run: () => Promise<unknown>, reason: string) {
  expect(await failureText(run)).to.include(reason);
}

/** Capture failure without turning successful execution into a passing test. */
export async function failureText(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (!Is.error(error)) throw error;
    expect(error.message.length).to.be.at.most(16_000);
    return error.message;
  }
  throw new Error('Expected ZIP tool failure.');
}

/** Guard refusals must carry owner identity, not just matching diagnostic text. */
export async function expectRefusal(run: () => Promise<unknown>, reason?: string) {
  try {
    await run();
  } catch (error) {
    expect(isGuardFailure(error)).to.eql(true);
    if (reason && isGuardFailure(error)) expect(error.message).to.include(reason);
    return;
  }
  throw new Error('Expected ZIP guard refusal.');
}
