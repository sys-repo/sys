import type { DomMock as StdDomMock, DomMockInitArgs as StdDomMockInitArgs } from '@sys/std/t';
import type {
  DomMock as TestingDomMock,
  DomMockInitArgs as TestingDomMockInitArgs,
} from '@sys/testing/t';
import { describe, expect, expectTypeOf, it } from '../-test.ts';
import { DomMock } from './mod.ts';

describe('Server DOM mock facade', () => {
  it('preserves canonical identity and type contracts', async () => {
    const std = await import('@sys/std/testing/server/dom');
    const facade = await import('@sys/testing/server/dom');

    const testingArgs: TestingDomMockInitArgs = {
      beforeAll: () => undefined,
      afterAll: () => undefined,
    };
    const testingEachArgs: TestingDomMockInitArgs = {
      beforeEach: () => undefined,
      afterEach: () => undefined,
    };
    // @ts-expect-error lifecycle hooks must be paired by scope.
    const invalidInitArgs: TestingDomMockInitArgs = {
      beforeAll: () => undefined,
      afterEach: () => undefined,
    };
    // @ts-expect-error lifecycle hooks must be paired by scope.
    const invalidStdInitArgs: StdDomMockInitArgs = {
      beforeAll: () => undefined,
      afterEach: () => undefined,
    };
    void invalidInitArgs;
    void invalidStdInitArgs;

    expect(facade.DomMock).to.equal(DomMock);
    expect(facade.DomMock).to.equal(std.DomMock);
    expect(Object.isFrozen(facade.DomMock)).to.eql(true);
    expectTypeOf(facade.DomMock).toEqualTypeOf<TestingDomMock.Lib>();
    expectTypeOf(facade.DomMock).toEqualTypeOf<StdDomMock.Lib>();
    expectTypeOf<TestingDomMockInitArgs>(testingArgs).toEqualTypeOf<StdDomMockInitArgs>();
    expectTypeOf(testingEachArgs).toMatchTypeOf<StdDomMockInitArgs>();
  });
});
