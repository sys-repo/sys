import { describe, expect, it } from '../-test.ts';
import { DomMock } from '../m.server/m.DomMock/mod.ts';
import { Browser, Testing } from '../m.server/mod.ts';
import { WebFixture } from '../m.web/mod.ts';
import { Test } from '../m.client/m.Spec/TestSuite/mod.ts';
import { Def } from '../m.client/m.Spec/TestSuite/TestSuiteModel.ts';
import {
  Constraints,
  Is,
  Loader,
  ResultTree,
  Stats,
  TestTree,
  Total,
  Tree,
} from '../m.client/m.Spec/TestSuite.helpers/mod.ts';

describe('testing namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      Testing,
      Browser,
      Browser.Executable,
      DomMock,
      Browser.ServiceWorker,
      WebFixture,
      WebFixture.Fetch,
      WebFixture.Property,
      WebFixture.WebSocket,
      Test,
      Test.Is,
      Test.Tree,
      Test.Tree.Is,
      Test.Tree.Tests,
      Test.Tree.Results,
      Test.Total,
      Test.Stats,
      Constraints,
      Is,
      Loader,
      ResultTree,
      Stats,
      TestTree,
      Total,
      Tree,
      Def,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
