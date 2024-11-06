import { describe, expect, it } from '../../-test.ts';
import { DevBus, Context, Spec } from '../mod.ts';
import { Is } from './mod.ts';
import { rx, type t } from '../common.ts';

describe('Is (flags)', () => {
  const bus = rx.bus();
  const instance: t.DevInstance = { bus, id: 'foo' };

  it('includes base methods', () => {
    expect(typeof Is.promise).to.eql('function');
  });

  it('ctx', async () => {
    const events = DevBus.Controller({ instance });
    const { ctx } = await Context.init(instance);

    const test = (input: any, expected: boolean) => {
      expect(Is.ctx(input)).to.eql(expected);
    };

    test(ctx, true);
    test(ctx.toObject(), false);
    [undefined, null, {}, [], 123, 'foo', true].forEach((value) => test(value, false));

    events.dispose();
  });

  it('suite (spec)', async () => {
    const suite = Spec.describe('foo');
    await suite.init();

    const test = (input: any, expected: boolean) => {
      expect(Is.suite(input)).to.eql(expected);
    };

    test(suite, true);
    [undefined, null, {}, [], 123, 'foo', true].forEach((value) => test(value, false));
  });

  it('test (it/spec)', async () => {
    let _test: t.TestModel;
    const suite = Spec.describe('foo', (e) => (_test = e.it('bar')));
    await suite.init();

    const test = (input: any, expected: boolean) => {
      expect(Is.test(input)).to.eql(expected);
    };

    test(_test!, true);
    test(suite, false);
    [undefined, null, {}, [], 123, 'foo', true].forEach((value) => test(value, false));
  });

  it('test | test-args', async () => {
    let _test: t.TestModel;
    let _args: t.TestHandlerArgs;
    const suite = Spec.describe('foo', (e) => {
      _test = e.it('bar', (e) => (_args = e));
    });
    await suite.run();

    [undefined, null, {}, [], 123, 'foo', true, () => null].forEach((value) => {
      expect(Is.test(value)).to.eql(false);
      expect(Is.testArgs(value)).to.eql(false);
    });

    expect(Is.test(suite)).to.eql(false);
    expect(Is.test(_test!)).to.eql(true);
    expect(Is.testArgs(_args!)).to.eql(true);
  });

  it('nil', () => {
    expect(Is.nil()).to.eql(true);
    expect(Is.nil(undefined)).to.eql(true);
    expect(Is.nil(null)).to.eql(true);
    [0, false, {}, [], ''].forEach((value) => expect(Is.nil(value)).to.eql(false));
  });
});
