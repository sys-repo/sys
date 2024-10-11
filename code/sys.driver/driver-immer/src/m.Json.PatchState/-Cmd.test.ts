import { Tests } from '@sys/cmd/testing';
import { describe, expect, it, rx, type t } from '../-test.ts';
import { PatchState } from './mod.ts';

const setup: t.CmdTestSetup = async () => {
  const { dispose, dispose$ } = rx.disposable();
  const factory: t.CmdTestFactory = () => PatchState.create({});
  const res: t.CmdTestState = { doc: await factory(), factory, dispose, dispose$ };
  return res;
};

describe('Cmd ← PatchState', () => {
  Tests.all(setup, { describe, it, expect });
});
