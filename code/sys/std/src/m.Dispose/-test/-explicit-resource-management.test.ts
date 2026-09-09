import { describe, expect, it } from '../../-test.ts';

describe('ECMAScript Explicit Resource Management', () => {
  it('using: scope exit → calls Symbol.dispose in reverse declaration order', () => {
    const events: string[] = [];
    {
      using _first = {
        [Symbol.dispose]() {
          events.push('first:dispose');
        },
      };
      using _second = {
        [Symbol.dispose]() {
          events.push('second:dispose');
        },
      };
      events.push('body');
    }

    expect(events).to.eql(['body', 'second:dispose', 'first:dispose']);
  });

  it('await using: scope exit → awaits Symbol.asyncDispose completion', async () => {
    const events: string[] = [];
    {
      await using _resource = {
        async [Symbol.asyncDispose]() {
          events.push('dispose:start');
          await Promise.resolve();
          events.push('dispose:complete');
        },
      };
      events.push('body');
    }

    expect(events).to.eql(['body', 'dispose:start', 'dispose:complete']);
  });

  it('await using: no Symbol.asyncDispose → falls back to Symbol.dispose', async () => {
    const events: string[] = [];
    {
      await using _resource = {
        [Symbol.dispose]() {
          events.push('dispose:sync');
        },
      };
      events.push('body');
    }

    expect(events).to.eql(['body', 'dispose:sync']);
  });

  it('using: body and Symbol.dispose throw → disposal error suppresses body error', () => {
    const bodyError = new Error('body failure');
    const disposeError = new Error('dispose failure');
    let caught: unknown;

    try {
      using _resource = {
        [Symbol.dispose]() {
          throw disposeError;
        },
      };
      throw bodyError;
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.instanceOf(SuppressedError);
    const suppressed = caught as SuppressedError;
    expect(suppressed.error).to.equal(disposeError);
    expect(suppressed.suppressed).to.equal(bodyError);
  });
});
