import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Cli } from '../../m.core/mod.ts';
import { FakeSpinner } from '../mod.ts';

describe('CLI: testing / FakeSpinner', () => {
  it('creates a spinner-compatible fake with observable lifecycle counters', () => {
    const spinner = FakeSpinner.create('starting…');

    expectTypeOf(spinner).toMatchTypeOf<t.CliSpinner.Instance>();
    expect(spinner.text).to.eql('starting…');
    expect(spinner.status).to.eql('idle');
    expect(spinner.starts).to.eql(0);
    expect(spinner.stops).to.eql(0);
    expect(spinner.renders).to.eql(0);

    expect(spinner.start()).to.equal(spinner);
    expect(spinner.status).to.eql('spinning');
    expect(spinner.starts).to.eql(1);

    expect(spinner.render()).to.equal(spinner);
    expect(spinner.renders).to.eql(1);

    expect(spinner.stop()).to.equal(spinner);
    expect(spinner.status).to.eql('stopped');
    expect(spinner.stops).to.eql(1);
  });

  it('updates text when labels are passed to lifecycle methods', () => {
    const spinner = FakeSpinner.create('one');

    spinner.start('two');
    expect(spinner.text).to.eql('two');

    spinner.succeed('done');
    expect(spinner.text).to.eql('done');
    expect(spinner.status).to.eql('succeeded');
    expect(spinner.succeeds).to.eql(1);
    expect(spinner.stops).to.eql(1);

    spinner.fail('failed');
    expect(spinner.text).to.eql('failed');
    expect(spinner.status).to.eql('failed');
    expect(spinner.fails).to.eql(1);
    expect(spinner.stops).to.eql(2);
  });

  it('does not depend on this binding', () => {
    const spinner = FakeSpinner.create('one');
    const { start, render, stop } = spinner;

    expect(start('two')).to.equal(spinner);
    expect(render()).to.equal(spinner);
    expect(stop()).to.equal(spinner);

    expect(spinner.text).to.eql('two');
    expect(spinner.starts).to.eql(1);
    expect(spinner.renders).to.eql(1);
    expect(spinner.stops).to.eql(1);
  });

  describe('stub', () => {
    it('returns the configured fake and snapshots factory calls in order', () => {
      const spinner = FakeSpinner.create('configured');
      const options: t.CliSpinner.Create.Options = { target: 'stdout' };
      using stub = FakeSpinner.stub({ spinner });

      const first = Cli.Spinner.create('working', options);
      options.target = 'stderr';
      const second = Cli.Spinner.create();

      expect(first).to.equal(spinner);
      expect(second).to.equal(spinner);
      expect(stub.calls).to.eql([
        { text: 'working', options: { target: 'stdout' } },
        { text: undefined, options: undefined },
      ]);
    });

    it('restores the exact factory descriptor idempotently', () => {
      const before = Object.getOwnPropertyDescriptor(Cli.Spinner, 'create');
      using stub = FakeSpinner.stub();
      const installed = Object.getOwnPropertyDescriptor(Cli.Spinner, 'create');

      expect(installed?.value).not.to.equal(before?.value);
      stub[Symbol.dispose]();
      stub[Symbol.dispose]();

      expect(Object.getOwnPropertyDescriptor(Cli.Spinner, 'create')).to.eql(before);
    });

    it('restores the factory when a using scope throws', () => {
      const before = Object.getOwnPropertyDescriptor(Cli.Spinner, 'create');
      const cause = new Error('scope-failed');
      let thrown: unknown;

      try {
        using stub = FakeSpinner.stub();
        expect(Cli.Spinner.create()).to.equal(stub.spinner);
        throw cause;
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(Object.getOwnPropertyDescriptor(Cli.Spinner, 'create')).to.eql(before);
    });

    it('restores nested stubs in lexical order', () => {
      const original = Cli.Spinner.create;
      {
        using outer = FakeSpinner.stub();
        const outerFactory = Cli.Spinner.create;
        {
          using inner = FakeSpinner.stub();
          expect(Cli.Spinner.create()).to.equal(inner.spinner);
        }
        expect(Cli.Spinner.create).to.equal(outerFactory);
        expect(Cli.Spinner.create()).to.equal(outer.spinner);
      }
      expect(Cli.Spinner.create).to.equal(original);
    });
  });
});
