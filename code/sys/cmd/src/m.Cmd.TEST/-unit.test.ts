import { Immutable, describe, expect, it, rx, type t } from '../-test.ts';
import { Tests } from './mod.ts';

/**
 * NB: this is the "immutable system" setup that is unique
 *     to each module using a different transport/approach
 *     underlying the common <Cmd> system.
 *
 * This core implementation uses the simple ("simplistic")
 * cloner ImmutableRef<T> tool from [sys.util].
 */
const setup: t.CmdTestSetup = async () => {
  const { dispose, dispose$ } = rx.disposable();
  const factory: t.CmdTestFactory = () => Immutable.clonerRef({});
  const doc = await factory();
  const res: t.CmdTestState = { doc, factory, dispose, dispose$ };
  return res;
};

/**
 * Standardised test suite for the <Cmd> system.
 */
describe('Cmd (Command)', () => {
  Tests.all(setup, { describe, it, expect });
});
