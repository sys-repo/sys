import type {
  Cli as CliFromT,
  CliInput as CliInputFromT,
  CliIs as CliIsFromT,
  CliKeyboard as CliKeyboardFromT,
  CliPrompt as CliPromptFromT,
  CliScreen as CliScreenFromT,
} from '@sys/cli/t';
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
type ExpectedQuitInput = Pick<BoundKeypressEvent, 'key' | 'ctrlKey'>;
type ExpectedRedrawInput = Partial<
  Pick<BoundKeypressEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey'>
>;
type ExpectedBackInput = Partial<
  Pick<BoundKeypressEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey'>
>;
type ExpectedMenuResultKind = 'exit' | 'back' | 'stay';
type ExpectedMenuResult =
  | { readonly kind: ExpectedMenuResultKind }
  | ExpectedMenuResultKind
  | undefined;

type CanonicalHelperProof = [
  // Screen: module owner → root projection → published type entry.
  Assert<Equal<t.CliScreen.Size, t.Cli.Screen.Size>>,
  Assert<Equal<t.CliScreen.Size, CliScreenFromT.Size>>,
  Assert<Equal<t.CliScreen.Events, t.Cli.Screen.Events>>,
  Assert<Equal<t.CliScreen.Events, CliScreenFromT.Events>>,
  Assert<Equal<t.CliScreen.Event, t.Cli.Screen.Event>>,
  Assert<Equal<t.CliScreen.Event, CliScreenFromT.Event>>,
  Assert<Equal<t.CliScreen.SizeChanged, t.Cli.Screen.SizeChanged>>,
  Assert<Equal<t.CliScreen.SizeChanged, CliScreenFromT.SizeChanged>>,

  // Keyboard: predicate and binding contracts.
  Assert<Equal<t.CliKeyboard.Is.Lib, t.Cli.Keyboard.Is.Lib>>,
  Assert<Equal<t.CliKeyboard.Is.Lib, CliKeyboardFromT.Is.Lib>>,
  Assert<Equal<t.CliKeyboard.Is.QuitInput, ExpectedQuitInput>>,
  Assert<Equal<t.CliKeyboard.Is.QuitInput, t.Cli.Keyboard.Is.QuitInput>>,
  Assert<Equal<t.CliKeyboard.Is.QuitInput, CliKeyboardFromT.Is.QuitInput>>,
  Assert<Equal<t.CliKeyboard.Is.RedrawInput, ExpectedRedrawInput>>,
  Assert<BoundKeypressEvent extends t.CliKeyboard.Is.RedrawInput ? true : false>,
  Assert<Equal<t.CliKeyboard.Is.RedrawInput, t.Cli.Keyboard.Is.RedrawInput>>,
  Assert<Equal<t.CliKeyboard.Is.RedrawInput, CliKeyboardFromT.Is.RedrawInput>>,
  Assert<Equal<t.CliKeyboard.Is.BackInput, ExpectedBackInput>>,
  Assert<BoundKeypressEvent extends t.CliKeyboard.Is.BackInput ? true : false>,
  Assert<Equal<t.CliKeyboard.Is.BackInput, t.Cli.Keyboard.Is.BackInput>>,
  Assert<Equal<t.CliKeyboard.Is.BackInput, CliKeyboardFromT.Is.BackInput>>,
  Assert<Equal<t.CliKeyboard.Bind.Options, t.Cli.Keyboard.Bind.Options>>,
  Assert<Equal<t.CliKeyboard.Bind.Options, CliKeyboardFromT.Bind.Options>>,
  Assert<Equal<t.CliKeyboard.Bind.Handle, t.Cli.Keyboard.Bind.Handle>>,
  Assert<Equal<t.CliKeyboard.Bind.Handle, CliKeyboardFromT.Bind.Handle>>,

  // Input: menu-result contracts remain derived from the literal source.
  Assert<Equal<t.CliInput.Menu.ResultKind, ExpectedMenuResultKind>>,
  Assert<Equal<t.CliInput.Menu.Result, ExpectedMenuResult>>,
  Assert<Equal<t.CliInput.Menu.ResultKind, t.Cli.Input.Menu.ResultKind>>,
  Assert<Equal<t.CliInput.Menu.ResultKind, CliInputFromT.Menu.ResultKind>>,
  Assert<Equal<t.CliInput.Menu.Result, t.Cli.Input.Menu.Result>>,
  Assert<Equal<t.CliInput.Menu.Result, CliInputFromT.Menu.Result>>,

  // Root operations: canonical ownership without a utility type spine.
  Assert<Equal<t.Cli.KeepAlive.Options, CliFromT.KeepAlive.Options>>,
  Assert<Equal<t.Cli.CopyToClipboard.Result, CliFromT.CopyToClipboard.Result>>,
];

describe('Cli: canonical helper type namespaces', () => {
  it('projects one exact helper contract through the public type entry', () => {
    expectTypeOf(Screen).toEqualTypeOf<t.CliScreen.Lib>();
    expectTypeOf(Screen).toEqualTypeOf<t.Cli.Screen.Lib>();
    expectTypeOf(Screen).toEqualTypeOf<CliScreenFromT.Lib>();

    expectTypeOf(Keyboard).toEqualTypeOf<t.CliKeyboard.Lib>();
    expectTypeOf(Keyboard).toEqualTypeOf<t.Cli.Keyboard.Lib>();
    expectTypeOf(Keyboard).toEqualTypeOf<CliKeyboardFromT.Lib>();
    expectTypeOf(Keyboard.Is).toEqualTypeOf<t.CliKeyboard.Is.Lib>();
    expectTypeOf(Keyboard.Is).toEqualTypeOf<t.Cli.Keyboard.Is.Lib>();
    expectTypeOf(Keyboard.Is).toEqualTypeOf<CliKeyboardFromT.Is.Lib>();

    expectTypeOf(Input).toEqualTypeOf<t.CliInput.Lib>();
    expectTypeOf(Input).toEqualTypeOf<t.Cli.Input.Lib>();
    expectTypeOf(Input).toEqualTypeOf<CliInputFromT.Lib>();

    expectTypeOf(Prompt).toEqualTypeOf<t.CliPrompt.Lib>();
    expectTypeOf(Prompt).toEqualTypeOf<t.Cli.Prompt.Lib>();
    expectTypeOf(Prompt).toEqualTypeOf<CliPromptFromT.Lib>();

    expectTypeOf(Is).toEqualTypeOf<t.CliIs.Lib>();
    expectTypeOf(Is).toEqualTypeOf<t.Cli.Is.Lib>();
    expectTypeOf(Is).toEqualTypeOf<CliIsFromT.Lib>();

    expectTypeOf(Cli.keepAlive).toEqualTypeOf<
      (options?: t.Cli.KeepAlive.Options) => Promise<never>
    >();
    expectTypeOf(Cli.copyToClipboard).toEqualTypeOf<
      (text: string) => Promise<t.Cli.CopyToClipboard.Result>
    >();

    type _CanonicalHelperProof = CanonicalHelperProof;
  });
});
