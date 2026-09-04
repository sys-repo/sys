import { describe, expect, expectTypeOf, it, stripAnsi, type t } from '../../../-test.ts';
import { Cli } from '../../mod.ts';
import {
  type SelectReaderOwner,
  type StartSelectDependencies,
  startSelectWith,
} from '../u.select.start.ts';
import { InputSelect, promptSelectWith } from '../u.select.ts';

describe('CLI: core / m.Input', () => {
  it('exposes the titleless Select contract', () => {
    type Value = 'alpha' | 'beta';
    type InputReturn = ReturnType<typeof Cli.Input.Select.prompt<Value>>;
    type PromptReturn = ReturnType<typeof Cli.Prompt.Select.prompt<Value>>;
    const inferObjectValue = () =>
      Cli.Input.Select.prompt({ options: [{ name: 'Now', value: new Date(0) }] });
    type InferredObjectReturn = ReturnType<typeof inferObjectValue>;

    const options: t.CliInput.Select.Options<Value> = {
      options: ['alpha', 'beta'],
    };

    expectTypeOf(Cli.Input).toEqualTypeOf<t.CliInput.Lib>();
    expectTypeOf(Cli.Input.Select.prompt).toEqualTypeOf<t.CliInput.Select.Prompt>();
    expectTypeOf(Cli.Input.Select.start).toEqualTypeOf<t.CliInput.Select.Start>();
    expectTypeOf({} as InputReturn).toEqualTypeOf<PromptReturn>();
    expectTypeOf({} as InferredObjectReturn).toEqualTypeOf<Promise<Date>>();
    expect(options.message).to.eql(undefined);
  });

  it('normalizes only title and automatic prefix without mutating caller options', async () => {
    const calls: t.CliInput.Select.Options<string>[] = [];
    const prompt = (options: t.CliInput.Select.Options<string>) => {
      calls.push(options);
      return Promise.resolve('alpha');
    };

    const omitted = Object.freeze({ options: ['alpha'] });
    await promptSelectWith(prompt, omitted);
    await promptSelectWith(prompt, { message: '', options: ['alpha'] });
    await promptSelectWith(prompt, { message: 'Choose:', options: ['alpha'] });
    await promptSelectWith(prompt, { message: ' ', options: ['alpha'] });
    await promptSelectWith(prompt, { message: '', prefix: '! ', options: ['alpha'] });
    await promptSelectWith(prompt, { message: 'Choose:', prefix: '', options: ['alpha'] });

    expect('message' in omitted).to.eql(false);
    expect(calls[0]?.options).to.equal(omitted.options);
    expect(calls[0]?.message).to.eql('');
    expect(calls[0]?.prefix).to.eql('');
    expect(calls[1]?.message).to.eql('');
    expect(calls[1]?.prefix).to.eql('');
    expect(calls[2]?.message).to.eql('Choose:');
    expect(calls[2]?.prefix).to.eql(undefined);
    expect(calls[3]?.message).to.eql(' ');
    expect(calls[3]?.prefix).to.eql(undefined);
    expect(calls[4]?.prefix).to.eql('! ');
    expect(calls[5]?.prefix).to.eql('');
  });

  it('renders a titleless Select at the list boundary while preserving its pointer', async () => {
    const output = await render({
      options: ['alpha', 'beta'],
      listPointer: '→',
    });

    expect(output.startsWith('\n')).to.eql(false);
    expect(output.startsWith('?')).to.eql(false);
    expect(output.split('\n')[0]).to.eql('→ alpha');
  });

  it('does not turn list indentation into a titleless header row', async () => {
    const output = await render({
      options: ['alpha', 'beta'],
      indent: '  ',
      listPointer: '→',
    });

    expect(output.startsWith('\n')).to.eql(false);
    expect(output.split('\n')[0]).to.eql('  → alpha');
  });

  it('retains Cliffy chrome for titled and explicitly prefixed Selects', async () => {
    const titled = await render({
      message: 'Choose:',
      options: ['alpha', 'beta'],
      listPointer: '→',
    });
    const prefixed = await render({
      message: 'Choose:',
      prefix: '! ',
      options: ['alpha', 'beta'],
      listPointer: '→',
    });

    expect(titled.split('\n')[0]).to.eql('? Choose:');
    expect(titled.split('\n')[1]).to.eql('→ alpha');
    expect(prefixed.split('\n')[0]).to.eql('! Choose:');
  });

  it('preserves visible defaults on titleless prompts', async () => {
    const output = await render({
      options: ['alpha', 'beta'],
      default: 'alpha',
      hideDefault: false,
      listPointer: '→',
    });

    expect(output.split('\n')[0]).to.eql(' (alpha)');
    expect(output.split('\n')[1]).to.eql('→ alpha');
  });

  it('settles lifecycle-owned keyboard selection and releases its reader', async () => {
    const input = createReaderOwner({ initial: new TextEncoder().encode('\x1b[B\r') });
    const started = startSelectWith(
      {
        createReader: () => input.owner,
        run(options) {
          return new InputSelect(options).prompt();
        },
      },
      { options: ['alpha', 'beta'], writer: silentWriter() },
    );

    expect(Object.isFrozen(started)).to.eql(true);
    const outcome = await started.finished;
    expect(outcome).to.eql({ kind: 'selected', value: 'beta' });
    expect(Object.isFrozen(outcome)).to.eql(true);
    expect(input.disposals()).to.eql(1);
    await started.dispose('test.after-selection');
    expect(input.disposals()).to.eql(1);
  });

  it('keeps disposal pending until interrupted prompt work and reader cleanup settle', async () => {
    const releaseInterrupt = Promise.withResolvers<void>();
    const input = createReaderOwner({ releaseInterrupt: releaseInterrupt.promise });
    const started = startSelectWith(
      {
        createReader: () => input.owner,
        run(options) {
          return new InputSelect(options).prompt();
        },
      },
      { options: ['alpha', 'beta'], writer: silentWriter() },
    );

    await input.reading;
    const disposing = started.dispose('test.cancel');
    await input.interrupted;
    let settled = false;
    void disposing.then(() => settled = true);
    await Promise.resolve();
    expect(settled).to.eql(false);
    expect(input.disposals()).to.eql(0);

    releaseInterrupt.resolve();
    await disposing;
    const outcome = await started.finished;
    expect(outcome).to.eql({ kind: 'cancelled' });
    expect(Object.isFrozen(outcome)).to.eql(true);
    expect(input.disposals()).to.eql(1);
  });

  it('cancels independently of group, search, and custom submit-key grammar', async () => {
    await proveGrammarIndependentCancellation(
      { options: [{ name: 'group', options: ['alpha'] }] },
      '\r',
    );
    await proveGrammarIndependentCancellation(
      { options: ['alpha', 'beta'], search: true },
      'a\x1b[A\r',
    );
    await proveGrammarIndependentCancellation(
      { options: ['alpha'], keys: { submit: ['space'] } },
      '\r',
    );
  });

  it('releases cancelled reader ownership for immediate reacquisition', async () => {
    let active = false;
    let current: ReturnType<typeof createReaderOwner> | undefined;
    const deps: StartSelectDependencies = {
      createReader() {
        if (active) throw new Error('test reader is already owned');
        active = true;
        current = createReaderOwner({ onDispose: () => active = false });
        return current.owner;
      },
      run(options) {
        return new InputSelect(options).prompt();
      },
    };
    const waitForRead = async () => {
      const input = current;
      if (!input) throw new Error('Expected an acquired test reader.');
      await input.reading;
    };

    const first = startSelectWith(deps, { options: ['alpha'], writer: silentWriter() });
    await waitForRead();
    await first.dispose('test.first.cancel');
    expect(active).to.eql(false);

    const second = startSelectWith(deps, { options: ['beta'], writer: silentWriter() });
    await waitForRead();
    await second.dispose('test.second.cancel');
    expect(active).to.eql(false);
    expect(await second.finished).to.eql({ kind: 'cancelled' });
  });
});

/** Helpers: */
async function render(options: t.CliInput.Select.Options<string>): Promise<string> {
  const decoder = new TextDecoder();
  const writes: string[] = [];
  const writer: NonNullable<t.CliInput.Select.Options<string>['writer']> = {
    writeSync(data) {
      writes.push(decoder.decode(data));
      return data.length;
    },
  };

  Cli.Prompt.Select.inject('alpha');
  try {
    await Cli.Input.Select.prompt({ ...options, writer });
  } finally {
    Cli.Prompt.Select.inject(undefined);
  }

  return stripAnsi(writes[0] ?? '');
}

function silentWriter(): NonNullable<t.CliInput.Select.Options<string>['writer']> {
  return { writeSync: (data) => data.length };
}

async function proveGrammarIndependentCancellation(
  options: t.CliInput.Select.StartOptions<string>,
  initial: string,
): Promise<void> {
  const input = createReaderOwner({ initial: new TextEncoder().encode(initial) });
  const started = startSelectWith(
    {
      createReader: () => input.owner,
      run(options) {
        return new InputSelect(options).prompt();
      },
    },
    { ...options, writer: silentWriter() },
  );

  await input.reading;
  await started.dispose('test.grammar.cancel');
  expect(await started.finished).to.eql({ kind: 'cancelled' });
  expect(input.disposals()).to.eql(1);
}

function createReaderOwner(options: {
  readonly initial?: Uint8Array;
  readonly releaseInterrupt?: Promise<void>;
  readonly onDispose?: () => void;
}): {
  readonly owner: SelectReaderOwner;
  readonly reading: Promise<void>;
  readonly interrupted: Promise<void>;
  disposals(): number;
} {
  const reading = Promise.withResolvers<void>();
  const interrupted = Promise.withResolvers<void>();
  let initial = options.initial;
  let interruption: { readonly reason: unknown } | undefined;
  let pending:
    | {
      readonly reject: (reason?: unknown) => void;
      readonly resolve: (value: number | null) => void;
    }
    | undefined;
  let disposals = 0;

  const owner: SelectReaderOwner = {
    reader: {
      read(buffer) {
        if (interruption) return Promise.reject(interruption.reason);
        if (initial) {
          const bytes = initial;
          initial = undefined;
          buffer.set(bytes);
          return Promise.resolve(bytes.length);
        }
        reading.resolve();
        return new Promise<number | null>((resolve, reject) => pending = { resolve, reject });
      },
      setRaw: () => undefined,
      isTerminal: () => false,
    },
    interrupt(reason) {
      if (interruption) return;
      interruption = { reason };
      interrupted.resolve();
      void (async () => {
        await options.releaseInterrupt;
        const request = pending;
        pending = undefined;
        request?.reject(reason);
      })();
    },
    dispose() {
      disposals += 1;
      options.onDispose?.();
    },
  };

  return {
    owner,
    reading: reading.promise,
    interrupted: interrupted.promise,
    disposals: () => disposals,
  };
}
