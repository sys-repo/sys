import { describe, expect, it } from '../../-test.ts';
import { Err } from '../mod.ts';

describe('Err.errors (Errors Collection Builder)', () => {
  it(`generates distinct instances`, () => {
    const a = Err.errors();
    const b = Err.errors();
    expect(a).to.not.equal(b);
  });

  it('empty by default', () => {
    const err = Err.errors();
    expect(err.ok).to.eql(true);
    expect(err.length).to.eql(0);
    expect(err.items.length).to.eql(0);
    expect(err.is.empty).to.eql(true);
  });

  it('add errors', () => {
    const err = Err.std('std-foo');
    const errors = Err.errors();
    errors.push(err);
    errors.push(err); // NB: does not add the same instance twice
    errors.push('foo').push('foo'); // NB: this will resovle to a new {StdError} and hence increment.
    expect(errors.ok).to.eql(false); // NB: greater-than no errors.
    expect(errors.length).to.eql(3);
    expect(errors.items.length).to.eql(3);
  });

  it('add an array of errors', () => {
    const err = Err.std('my-std-err');
    const errors = Err.errors();
    errors.push([err, 'foo', err, err, 'bar']);
    expect(errors.length).to.eql(3);
    expect(errors.items[0].message).to.eql('my-std-err');
    expect(errors.items[1].message).to.eql('foo');
    expect(errors.items[2].message).to.eql('bar');
  });

  it('add with two params (error and cause)', () => {
    const errors = Err.errors();

    errors.push('foo', 'bar');
    errors.push(Err.std('hello'), Err.std('fail'));
    const list = errors.items;

    expect(list[0].message).to.eql('foo');
    expect(list[0].cause?.message).to.eql('bar');

    expect(list[1].message).to.eql('hello');
    expect(list[1].cause?.message).to.eql('fail');
  });

  it('toError: nothing', () => {
    const errors = Err.errors();
    expect(errors.toError()).to.eql(undefined);
  });

  it('toError: single error', () => {
    const errors = Err.errors().push('foo');
    expect(errors.toError()?.message).to.eql('foo');
  });

  it('toError: multiple errors (Aggregate)', () => {
    const errors = Err.errors().push('foo').push('bar').push('zoo');
    const a = errors.toError();
    const b = errors.toError('my message');
    expect(a?.name).to.eql(Err.Name.aggregate);
    expect(a?.message).to.eql('Several errors occured.');
    expect(b?.message).to.eql('my message');
    expect(a?.errors).to.eql(b?.errors);
    expect(a?.errors?.length).to.eql(3);
    expect(a?.errors?.[2].message).to.eql('zoo');
  });
});
