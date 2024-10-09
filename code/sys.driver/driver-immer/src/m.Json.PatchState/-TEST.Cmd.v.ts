import { describe, it, expect, type t, rx } from '../-test.ts';
import { Tests } from '@sys/cmd/testing';
import { PatchState } from './mod.ts';

describe('Cmd ← PatchState', () => {
  Tests.all(setup, { describe, it, expect });
});

const setup: t.CmdTestSetup = async () => {
  const { dispose, dispose$ } = rx.disposable();
  const factory: t.CmdTestFactory = () => PatchState.create({});
  const res: t.CmdTestState = { doc: await factory(), factory, dispose, dispose$ };
  return res;
};
