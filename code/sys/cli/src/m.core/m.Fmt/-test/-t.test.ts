import type {
  Cli as CliFromT,
  CliFormat as CliFormatFromT,
  CliFormatChapters as CliFormatChaptersFromT,
  CliFormatCommit as CliFormatCommitFromT,
  CliFormatHeader as CliFormatHeaderFromT,
  CliFormatHelp as CliFormatHelpFromT,
  CliFormatKeyboard as CliFormatKeyboardFromT,
  CliFormatText as CliFormatTextFromT,
} from '@sys/cli/t';
import { describe, expectTypeOf, it, type t } from '../../../-test.ts';
import { Fmt } from '../mod.ts';

type Assert<T extends true> = t.Type.Assert<T>;
type Equal<A, B> = t.Type.Equal<A, B>;
type Exact4<A, B, C, D> = Equal<[A, A, A], [B, C, D]>;

type ExpectedCommitText = {
  readonly color?: t.AnsiColor.Name;
  readonly bold?: boolean;
  readonly italic?: boolean;
};
type ExpectedCommitTitle = false | string | ({ readonly text?: string } & ExpectedCommitText);
type ExpectedCommitOptions = {
  readonly title?: ExpectedCommitTitle;
  readonly indent?: number;
  readonly message?: ExpectedCommitText;
};
type ExpectedHeaderPackageIdentity =
  | t.Pkg
  | {
    readonly root: t.Pkg;
    readonly subpath: string;
  };
type ExpectedHeaderOptions = {
  pkg?: ExpectedHeaderPackageIdentity;
  width?: number;
  tone?: t.AnsiColor.Name;
  title?: string;
  detail?: string;
  version?: string | false;
  hr?: false | {
    color?: t.CliFormat.Hr.Color;
    weight?: t.CliFormat.Hr.Weight;
  };
};
type ExpectedHeaderLib = {
  readonly rows: (options: ExpectedHeaderOptions) => readonly string[];
};
type ExpectedHyperlinkOptions = { underline?: boolean };
type ExpectedHyperlink = (label: string, href: URL, options?: ExpectedHyperlinkOptions) => string;
type ExpectedKeyboardCommandOptions = {
  label: string;
  keys: [first: string, ...rest: string[]];
  context?: string;
};
type ExpectedKeyboardCandidate = {
  right: string;
  left?: string;
};
type ExpectedKeyboardRowOptions = {
  width: number;
  candidates: ExpectedKeyboardCandidate[];
};
type ExpectedKeyboardLib = {
  readonly back: () => string;
  readonly command: (options: ExpectedKeyboardCommandOptions) => string;
  readonly row: (options: ExpectedKeyboardRowOptions) => string | undefined;
};

type ExpectedTextWidthLib = {
  readonly measure: (input: string) => number;
  readonly padEnd: (input: string, width: number) => string;
  readonly max: (inputs: string[]) => number;
  readonly fit: (options?: t.CliFormatText.Width.Fit.Options) => number;
};
type ExpectedTextWrapLib = {
  readonly text: (input: string, options: t.CliFormatText.Wrap.Options) => string;
  readonly lines: (
    input: string,
    options: t.CliFormatText.Wrap.Options,
  ) => readonly string[];
};
type ExpectedTextLib = {
  readonly isReady: () => boolean;
  readonly Width: ExpectedTextWidthLib;
  readonly Wrap: ExpectedTextWrapLib;
  readonly ellipsize: (
    input: string,
    width: number,
    options?: t.CliFormatText.Ellipsize.Options,
  ) => string;
};

type CanonicalFormatterProof = [
  // Preserved leaf semantics.
  Assert<Equal<t.CliFormat.Lib['isReady'], () => boolean>>,
  Assert<Equal<t.CliFormatHelp.Pair, readonly [left: string, right: string]>>,
  Assert<Equal<t.CliFormatHelp.Tone, 'default' | 'muted'>>,
  Assert<Equal<t.CliFormatCommit.Text, ExpectedCommitText>>,
  Assert<Equal<t.CliFormatCommit.Title, ExpectedCommitTitle>>,
  Assert<Equal<t.CliFormatCommit.Options, ExpectedCommitOptions>>,
  Assert<
    Equal<t.CliFormatText.Wrap.Preserve, 'default' | 'none' | ((line: string) => boolean)>
  >,

  // Base aggregate and landed Chapters surface.
  Assert<
    Exact4<t.CliFormat.Lib, t.Cli.Fmt.Lib, CliFormatFromT.Lib, CliFromT.Fmt.Lib>
  >,
  Assert<
    Exact4<
      t.CliFormatChapters.Lib,
      t.Cli.Fmt.Chapters.Lib,
      CliFormatChaptersFromT.Lib,
      CliFromT.Fmt.Chapters.Lib
    >
  >,

  // Hyperlink.
  Assert<Equal<t.CliFormat.Hyperlink.Options, ExpectedHyperlinkOptions>>,
  Assert<
    Exact4<
      t.CliFormat.Hyperlink.Options,
      t.Cli.Fmt.Hyperlink.Options,
      CliFormatFromT.Hyperlink.Options,
      CliFromT.Fmt.Hyperlink.Options
    >
  >,
  Assert<Equal<t.CliFormat.Hyperlink.Fn, ExpectedHyperlink>>,
  Assert<
    Exact4<
      t.CliFormat.Hyperlink.Fn,
      t.Cli.Fmt.Hyperlink.Fn,
      CliFormatFromT.Hyperlink.Fn,
      CliFromT.Fmt.Hyperlink.Fn
    >
  >,

  // Keyboard.
  Assert<Equal<t.CliFormatKeyboard.Lib, ExpectedKeyboardLib>>,
  Assert<Equal<t.CliFormatKeyboard.Command.Options, ExpectedKeyboardCommandOptions>>,
  Assert<Equal<t.CliFormatKeyboard.Row.Options, ExpectedKeyboardRowOptions>>,
  Assert<Equal<t.CliFormatKeyboard.Row.Candidate, ExpectedKeyboardCandidate>>,
  Assert<
    Exact4<
      t.CliFormatKeyboard.Lib,
      t.Cli.Fmt.Keyboard.Lib,
      CliFormatKeyboardFromT.Lib,
      CliFromT.Fmt.Keyboard.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormatKeyboard.Command.Options,
      t.Cli.Fmt.Keyboard.Command.Options,
      CliFormatKeyboardFromT.Command.Options,
      CliFromT.Fmt.Keyboard.Command.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormatKeyboard.Row.Options,
      t.Cli.Fmt.Keyboard.Row.Options,
      CliFormatKeyboardFromT.Row.Options,
      CliFromT.Fmt.Keyboard.Row.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormatKeyboard.Row.Candidate,
      t.Cli.Fmt.Keyboard.Row.Candidate,
      CliFormatKeyboardFromT.Row.Candidate,
      CliFromT.Fmt.Keyboard.Row.Candidate
    >
  >,

  // Header.
  Assert<Equal<t.CliFormatHeader.PackageIdentity, ExpectedHeaderPackageIdentity>>,
  Assert<Equal<t.CliFormatHeader.Lib, ExpectedHeaderLib>>,
  Assert<Equal<t.CliFormatHeader.Options, ExpectedHeaderOptions>>,
  Assert<
    Exact4<
      t.CliFormatHeader.PackageIdentity,
      t.Cli.Fmt.Header.PackageIdentity,
      CliFormatHeaderFromT.PackageIdentity,
      CliFromT.Fmt.Header.PackageIdentity
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHeader.Lib,
      t.Cli.Fmt.Header.Lib,
      CliFormatHeaderFromT.Lib,
      CliFromT.Fmt.Header.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHeader.Options,
      t.Cli.Fmt.Header.Options,
      CliFormatHeaderFromT.Options,
      CliFromT.Fmt.Header.Options
    >
  >,

  // Help.
  Assert<
    Exact4<
      t.CliFormatHelp.Lib,
      t.Cli.Fmt.Help.Lib,
      CliFormatHelpFromT.Lib,
      CliFromT.Fmt.Help.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.Input,
      t.Cli.Fmt.Help.Input,
      CliFormatHelpFromT.Input,
      CliFromT.Fmt.Help.Input
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.InputBase,
      t.Cli.Fmt.Help.InputBase,
      CliFormatHelpFromT.InputBase,
      CliFromT.Fmt.Help.InputBase
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.InputSections,
      t.Cli.Fmt.Help.InputSections,
      CliFormatHelpFromT.InputSections,
      CliFromT.Fmt.Help.InputSections
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.InputShorthand,
      t.Cli.Fmt.Help.InputShorthand,
      CliFormatHelpFromT.InputShorthand,
      CliFromT.Fmt.Help.InputShorthand
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.Section,
      t.Cli.Fmt.Help.Section,
      CliFormatHelpFromT.Section,
      CliFromT.Fmt.Help.Section
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.Pair,
      t.Cli.Fmt.Help.Pair,
      CliFormatHelpFromT.Pair,
      CliFromT.Fmt.Help.Pair
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.Option,
      t.Cli.Fmt.Help.Option,
      CliFormatHelpFromT.Option,
      CliFromT.Fmt.Help.Option
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.Tone,
      t.Cli.Fmt.Help.Tone,
      CliFormatHelpFromT.Tone,
      CliFromT.Fmt.Help.Tone
    >
  >,
  Assert<
    Exact4<
      t.CliFormatHelp.LayoutOptions,
      t.Cli.Fmt.Help.LayoutOptions,
      CliFormatHelpFromT.LayoutOptions,
      CliFromT.Fmt.Help.LayoutOptions
    >
  >,

  // Commit.
  Assert<
    Exact4<
      t.CliFormatCommit.Lib,
      t.Cli.Fmt.Commit.Lib,
      CliFormatCommitFromT.Lib,
      CliFromT.Fmt.Commit.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormatCommit.Options,
      t.Cli.Fmt.Commit.Options,
      CliFormatCommitFromT.Options,
      CliFromT.Fmt.Commit.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormatCommit.Title,
      t.Cli.Fmt.Commit.Title,
      CliFormatCommitFromT.Title,
      CliFromT.Fmt.Commit.Title
    >
  >,
  Assert<
    Exact4<
      t.CliFormatCommit.Text,
      t.Cli.Fmt.Commit.Text,
      CliFormatCommitFromT.Text,
      CliFromT.Fmt.Commit.Text
    >
  >,

  // Text operation and policy contracts.
  Assert<Equal<t.CliFormatText.Lib, ExpectedTextLib>>,
  Assert<Equal<t.CliFormatText.Width.Lib, ExpectedTextWidthLib>>,
  Assert<Equal<t.CliFormatText.Wrap.Lib, ExpectedTextWrapLib>>,
  Assert<
    Exact4<
      t.CliFormatText.Lib,
      t.Cli.Fmt.Text.Lib,
      CliFormatTextFromT.Lib,
      CliFromT.Fmt.Text.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Width.Lib,
      t.Cli.Fmt.Text.Width.Lib,
      CliFormatTextFromT.Width.Lib,
      CliFromT.Fmt.Text.Width.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Wrap.Lib,
      t.Cli.Fmt.Text.Wrap.Lib,
      CliFormatTextFromT.Wrap.Lib,
      CliFromT.Fmt.Text.Wrap.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Width.Fit.Options,
      t.Cli.Fmt.Text.Width.Fit.Options,
      CliFormatTextFromT.Width.Fit.Options,
      CliFromT.Fmt.Text.Width.Fit.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Wrap.Options,
      t.Cli.Fmt.Text.Wrap.Options,
      CliFormatTextFromT.Wrap.Options,
      CliFromT.Fmt.Text.Wrap.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Wrap.Preserve,
      t.Cli.Fmt.Text.Wrap.Preserve,
      CliFormatTextFromT.Wrap.Preserve,
      CliFromT.Fmt.Text.Wrap.Preserve
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Wrap.PreserveFn,
      t.Cli.Fmt.Text.Wrap.PreserveFn,
      CliFormatTextFromT.Wrap.PreserveFn,
      CliFromT.Fmt.Text.Wrap.PreserveFn
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Ellipsize.Options,
      t.Cli.Fmt.Text.Ellipsize.Options,
      CliFormatTextFromT.Ellipsize.Options,
      CliFromT.Fmt.Text.Ellipsize.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Ellipsize.Parts,
      t.Cli.Fmt.Text.Ellipsize.Parts,
      CliFormatTextFromT.Ellipsize.Parts,
      CliFromT.Fmt.Text.Ellipsize.Parts
    >
  >,
  Assert<
    Exact4<
      t.CliFormatText.Ellipsize.Render,
      t.Cli.Fmt.Text.Ellipsize.Render,
      CliFormatTextFromT.Ellipsize.Render,
      CliFromT.Fmt.Text.Ellipsize.Render
    >
  >,

  // Base formatter sub-libraries.
  Assert<
    Exact4<
      t.CliFormat.Path.Lib,
      t.Cli.Fmt.Path.Lib,
      CliFormatFromT.Path.Lib,
      CliFromT.Fmt.Path.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.Path.FormatOptions,
      t.Cli.Fmt.Path.FormatOptions,
      CliFormatFromT.Path.FormatOptions,
      CliFromT.Fmt.Path.FormatOptions
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.Path.TtyOptions,
      t.Cli.Fmt.Path.TtyOptions,
      CliFormatFromT.Path.TtyOptions,
      CliFromT.Fmt.Path.TtyOptions
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.ServiceUrl.Lib,
      t.Cli.Fmt.ServiceUrl.Lib,
      CliFormatFromT.ServiceUrl.Lib,
      CliFromT.Fmt.ServiceUrl.Lib
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.ServiceUrl.Part,
      t.Cli.Fmt.ServiceUrl.Part,
      CliFormatFromT.ServiceUrl.Part,
      CliFromT.Fmt.ServiceUrl.Part
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.ServiceUrl.DisplayHostname.Method,
      t.Cli.Fmt.ServiceUrl.DisplayHostname.Method,
      CliFormatFromT.ServiceUrl.DisplayHostname.Method,
      CliFromT.Fmt.ServiceUrl.DisplayHostname.Method
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.ServiceUrl.DisplayHostname.Options,
      t.Cli.Fmt.ServiceUrl.DisplayHostname.Options,
      CliFormatFromT.ServiceUrl.DisplayHostname.Options,
      CliFromT.Fmt.ServiceUrl.DisplayHostname.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.ServiceUrl.Parts.Options,
      t.Cli.Fmt.ServiceUrl.Parts.Options,
      CliFormatFromT.ServiceUrl.Parts.Options,
      CliFromT.Fmt.ServiceUrl.Parts.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.ServiceUrl.Format.Options,
      t.Cli.Fmt.ServiceUrl.Format.Options,
      CliFormatFromT.ServiceUrl.Format.Options,
      CliFromT.Fmt.ServiceUrl.Format.Options
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.ServiceUrl.FormatList.Method,
      t.Cli.Fmt.ServiceUrl.FormatList.Method,
      CliFormatFromT.ServiceUrl.FormatList.Method,
      CliFromT.Fmt.ServiceUrl.FormatList.Method
    >
  >,
  Assert<
    Exact4<
      t.CliFormat.Tree.Lib,
      t.Cli.Fmt.Tree.Lib,
      CliFormatFromT.Tree.Lib,
      CliFromT.Fmt.Tree.Lib
    >
  >,
];

describe('Cli.Fmt: canonical formatter type namespaces', () => {
  it('projects one exact base formatter contract through the public type entry', () => {
    expectTypeOf(Fmt).toEqualTypeOf<t.CliFormat.Lib>();
    expectTypeOf(Fmt).toEqualTypeOf<t.Cli.Fmt.Lib>();
    expectTypeOf(Fmt).toEqualTypeOf<CliFormatFromT.Lib>();

    expectTypeOf(Fmt.Header).toEqualTypeOf<t.CliFormatHeader.Lib>();
    expectTypeOf(Fmt.Keyboard).toEqualTypeOf<t.CliFormatKeyboard.Lib>();
    expectTypeOf(Fmt.Help).toEqualTypeOf<t.CliFormatHelp.Lib>();
    expectTypeOf(Fmt.Commit).toEqualTypeOf<t.CliFormatCommit.Lib>();
    expectTypeOf(Fmt.Text).toEqualTypeOf<t.CliFormatText.Lib>();
    expectTypeOf(Fmt.Text.Width).toEqualTypeOf<t.CliFormatText.Width.Lib>();
    expectTypeOf(Fmt.Text.Wrap).toEqualTypeOf<t.CliFormatText.Wrap.Lib>();
    expectTypeOf(Fmt.Chapters).toEqualTypeOf<t.CliFormatChapters.Lib>();
    expectTypeOf(Fmt.hyperlink).toEqualTypeOf<t.CliFormat.Hyperlink.Fn>();
    expectTypeOf(Fmt.Path).toEqualTypeOf<t.CliFormat.Path.Lib>();
    expectTypeOf(Fmt.ServiceUrl).toEqualTypeOf<t.CliFormat.ServiceUrl.Lib>();
    expectTypeOf(Fmt.Tree).toEqualTypeOf<t.CliFormat.Tree.Lib>();

    type _CanonicalFormatterProof = CanonicalFormatterProof;
  });
});
