import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
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

  describe('adapter', () => {
    it('returns the configured fake and snapshots factory calls in order', () => {
      const spinner = FakeSpinner.create('configured');
      const options: t.CliSpinner.Create.Options = { target: 'stdout' };
      const adapter = FakeSpinner.adapter({ spinner });

      const first = adapter.create('working', options);
      options.target = 'stderr';
      const second = adapter.create();

      expect(first).to.equal(spinner);
      expect(second).to.equal(spinner);
      expect(adapter.calls).to.eql([
        { text: 'working', options: { target: 'stdout' } },
        { text: undefined, options: undefined },
      ]);
    });

    it('creates isolated explicit factory dependencies', () => {
      const first = FakeSpinner.adapter();
      const second = FakeSpinner.adapter();

      expect(first.create()).to.equal(first.spinner);
      expect(second.create()).to.equal(second.spinner);
      expect(first.spinner).not.to.equal(second.spinner);
      expect(first.calls).to.eql([{ text: undefined, options: undefined }]);
      expect(second.calls).to.eql([{ text: undefined, options: undefined }]);
    });
  });
});
