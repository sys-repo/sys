import { describe, expect, expectTypeOf, it, stripAnsi, type t } from '../../../-test.ts';
import { Cli } from '../../mod.ts';

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
    expectTypeOf({} as InputReturn).toEqualTypeOf<PromptReturn>();
    expectTypeOf({} as InferredObjectReturn).toEqualTypeOf<Promise<Date>>();
    expect(options.message).to.eql(undefined);
  });

  it('normalizes only title and automatic prefix without mutating caller options', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(Cli.Prompt.Select, 'prompt');
    if (!descriptor) throw new Error('Expected Cliffy Select.prompt descriptor.');

    const calls: Record<string, unknown>[] = [];
    Object.defineProperty(Cli.Prompt.Select, 'prompt', {
      ...descriptor,
      value: (options: Record<string, unknown>) => {
        calls.push(options);
        return Promise.resolve('alpha');
      },
    });

    const omitted = Object.freeze({ options: ['alpha'] });
    try {
      await Cli.Input.Select.prompt(omitted);
      await Cli.Input.Select.prompt({ message: '', options: ['alpha'] });
      await Cli.Input.Select.prompt({ message: 'Choose:', options: ['alpha'] });
      await Cli.Input.Select.prompt({ message: ' ', options: ['alpha'] });
      await Cli.Input.Select.prompt({ message: '', prefix: '! ', options: ['alpha'] });
      await Cli.Input.Select.prompt({ message: 'Choose:', prefix: '', options: ['alpha'] });
    } finally {
      Object.defineProperty(Cli.Prompt.Select, 'prompt', descriptor);
    }

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
});

async function render(options: t.CliInput.Select.Options<string>) {
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
