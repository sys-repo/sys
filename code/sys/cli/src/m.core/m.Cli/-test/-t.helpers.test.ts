import type {
  Cli as CliFromT,
  CliInput as CliInputFromT,
  CliIs as CliIsFromT,
  CliKeyboard as CliKeyboardFromT,
  CliPrompt as CliPromptFromT,
  CliScreen as CliScreenFromT,
} from '@sys/cli/t';
import type {
  Cli as CliFromTypes,
  CliInput as CliInputFromTypes,
  CliIs as CliIsFromTypes,
  CliKeyboard as CliKeyboardFromTypes,
  CliPrompt as CliPromptFromTypes,
  CliScreen as CliScreenFromTypes,
} from '@sys/cli/types';
import { describe, expectTypeOf, it, type t } from '../../../-test.ts';
import { Input } from '../../m.Input/mod.ts';
import { Is } from '../../m.Is/mod.ts';
import { Keyboard } from '../../m.Keyboard/mod.ts';
import { Prompt } from '../../m.Prompt/mod.ts';
import { Screen } from '../../m.Screen/mod.ts';
import { Cli } from '../mod.ts';

type Assert<T extends true> = t.Type.Assert<T>;
type Equal<A, B> = t.Type.Equal<A, B>;
type BoundKeypressEvent = Parameters<NonNullable<t.CliKeyboard.Bind.Options['onKey']>>[0];
type ExpectedRedrawInput = Partial<
  Pick<BoundKeypressEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey'>
>;
type RedrawInput = Parameters<t.CliKeyboard.Lib['isRedraw']>[0];
type ExpectedMenuResultKind = 'exit' | 'back' | 'stay';
type ExpectedMenuResult =
  | { readonly kind: ExpectedMenuResultKind }
  | ExpectedMenuResultKind
  | undefined;

type CanonicalHelperProof = [
  // Screen: module owner → root projection → published entries.
  Assert<Equal<t.CliScreen.Size, t.Cli.Screen.Size>>,
  Assert<Equal<t.CliScreen.Size, CliScreenFromT.Size>>,
  Assert<Equal<t.CliScreen.Size, CliScreenFromTypes.Size>>,
  Assert<Equal<t.CliScreen.Events, t.Cli.Screen.Events>>,
  Assert<Equal<t.CliScreen.Events, CliScreenFromT.Events>>,
  Assert<Equal<t.CliScreen.Events, CliScreenFromTypes.Events>>,
  Assert<Equal<t.CliScreen.Event, t.Cli.Screen.Event>>,
  Assert<Equal<t.CliScreen.Event, CliScreenFromT.Event>>,
  Assert<Equal<t.CliScreen.Event, CliScreenFromTypes.Event>>,
  Assert<Equal<t.CliScreen.SizeChanged, t.Cli.Screen.SizeChanged>>,
  Assert<Equal<t.CliScreen.SizeChanged, CliScreenFromT.SizeChanged>>,
  Assert<Equal<t.CliScreen.SizeChanged, CliScreenFromTypes.SizeChanged>>,

  // Keyboard: operation-owned binding contracts.
  Assert<Equal<t.CliKeyboard.Event, t.Cli.Keyboard.Event>>,
  Assert<Equal<t.CliKeyboard.Event, CliKeyboardFromT.Event>>,
  Assert<Equal<t.CliKeyboard.Event, CliKeyboardFromTypes.Event>>,
  Assert<Equal<RedrawInput, ExpectedRedrawInput>>,
  Assert<BoundKeypressEvent extends RedrawInput ? true : false>,
  Assert<Equal<t.CliKeyboard.Bind.Options, t.Cli.Keyboard.Bind.Options>>,
  Assert<Equal<t.CliKeyboard.Bind.Options, CliKeyboardFromT.Bind.Options>>,
  Assert<Equal<t.CliKeyboard.Bind.Options, CliKeyboardFromTypes.Bind.Options>>,
  Assert<Equal<t.CliKeyboard.Bind.Handle, t.Cli.Keyboard.Bind.Handle>>,
  Assert<Equal<t.CliKeyboard.Bind.Handle, CliKeyboardFromT.Bind.Handle>>,
  Assert<Equal<t.CliKeyboard.Bind.Handle, CliKeyboardFromTypes.Bind.Handle>>,

  // Input: menu-result contracts remain derived from the literal source.
  Assert<Equal<t.CliInput.Menu.ResultKind, ExpectedMenuResultKind>>,
  Assert<Equal<t.CliInput.Menu.Result, ExpectedMenuResult>>,
  Assert<Equal<t.CliInput.Menu.ResultKind, t.Cli.Input.Menu.ResultKind>>,
  Assert<Equal<t.CliInput.Menu.ResultKind, CliInputFromT.Menu.ResultKind>>,
  Assert<Equal<t.CliInput.Menu.ResultKind, CliInputFromTypes.Menu.ResultKind>>,
  Assert<Equal<t.CliInput.Menu.Result, t.Cli.Input.Menu.Result>>,
  Assert<Equal<t.CliInput.Menu.Result, CliInputFromT.Menu.Result>>,
  Assert<Equal<t.CliInput.Menu.Result, CliInputFromTypes.Menu.Result>>,

  // Root operations: canonical ownership without a utility type spine.
  Assert<Equal<t.Cli.KeepAlive.Options, CliFromT.KeepAlive.Options>>,
  Assert<Equal<t.Cli.KeepAlive.Options, CliFromTypes.KeepAlive.Options>>,
  Assert<Equal<t.Cli.CopyToClipboard.Result, CliFromT.CopyToClipboard.Result>>,
  Assert<Equal<t.Cli.CopyToClipboard.Result, CliFromTypes.CopyToClipboard.Result>>,
];

describe('Cli: canonical helper type namespaces', () => {
  it('projects one exact helper contract through every public type entry', () => {
    expectTypeOf(Screen).toEqualTypeOf<t.CliScreen.Lib>();
    expectTypeOf(Screen).toEqualTypeOf<t.Cli.Screen.Lib>();
    expectTypeOf(Screen).toEqualTypeOf<CliScreenFromT.Lib>();
    expectTypeOf(Screen).toEqualTypeOf<CliScreenFromTypes.Lib>();

    expectTypeOf(Keyboard).toEqualTypeOf<t.CliKeyboard.Lib>();
    expectTypeOf(Keyboard).toEqualTypeOf<t.Cli.Keyboard.Lib>();
    expectTypeOf(Keyboard).toEqualTypeOf<CliKeyboardFromT.Lib>();
    expectTypeOf(Keyboard).toEqualTypeOf<CliKeyboardFromTypes.Lib>();

    expectTypeOf(Input).toEqualTypeOf<t.CliInput.Lib>();
    expectTypeOf(Input).toEqualTypeOf<t.Cli.Input.Lib>();
    expectTypeOf(Input).toEqualTypeOf<CliInputFromT.Lib>();
    expectTypeOf(Input).toEqualTypeOf<CliInputFromTypes.Lib>();

    expectTypeOf(Prompt).toEqualTypeOf<t.CliPrompt.Lib>();
    expectTypeOf(Prompt).toEqualTypeOf<t.Cli.Prompt.Lib>();
    expectTypeOf(Prompt).toEqualTypeOf<CliPromptFromT.Lib>();
    expectTypeOf(Prompt).toEqualTypeOf<CliPromptFromTypes.Lib>();

    expectTypeOf(Is).toEqualTypeOf<t.CliIs.Lib>();
    expectTypeOf(Is).toEqualTypeOf<t.Cli.Is.Lib>();
    expectTypeOf(Is).toEqualTypeOf<CliIsFromT.Lib>();
    expectTypeOf(Is).toEqualTypeOf<CliIsFromTypes.Lib>();

    expectTypeOf(Cli.keepAlive).toEqualTypeOf<
      (options?: t.Cli.KeepAlive.Options) => Promise<never>
    >();
    expectTypeOf(Cli.copyToClipboard).toEqualTypeOf<
      (text: string) => Promise<t.Cli.CopyToClipboard.Result>
    >();

    type _CanonicalHelperProof = CanonicalHelperProof;
  });
});
