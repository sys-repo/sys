import type {
  Cli as CliFromT,
  CliFormat as CliFormatFromT,
  CliFormatChapters as CliFormatChaptersFromT,
  CliFormatCommit as CliFormatCommitFromT,
  CliFormatHeader as CliFormatHeaderFromT,
  CliFormatHelp as CliFormatHelpFromT,
  CliFormatText as CliFormatTextFromT,
} from '@sys/cli/t';
import type {
  Cli as CliFromTypes,
  CliFormat as CliFormatFromTypes,
  CliFormatChapters as CliFormatChaptersFromTypes,
  CliFormatCommit as CliFormatCommitFromTypes,
  CliFormatHeader as CliFormatHeaderFromTypes,
  CliFormatHelp as CliFormatHelpFromTypes,
  CliFormatText as CliFormatTextFromTypes,
} from '@sys/cli/types';
import { describe, expectTypeOf, it, type t } from '../../../-test.ts';
import { Fmt } from '../mod.ts';

type Assert<T extends true> = t.Type.Assert<T>;
type Equal<A, B> = t.Type.Equal<A, B>;
type Exact6<A, B, C, D, E, F> = Equal<[A, A, A, A, A], [B, C, D, E, F]>;

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
type ExpectedHyperlink = (label: string, href: URL) => string;

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
    Exact6<
      t.CliFormat.Lib,
      t.Cli.Fmt.Lib,
      CliFormatFromT.Lib,
      CliFormatFromTypes.Lib,
      CliFromT.Fmt.Lib,
      CliFromTypes.Fmt.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormatChapters.Lib,
      t.Cli.Fmt.Chapters.Lib,
      CliFormatChaptersFromT.Lib,
      CliFormatChaptersFromTypes.Lib,
      CliFromT.Fmt.Chapters.Lib,
      CliFromTypes.Fmt.Chapters.Lib
    >
  >,

  // Hyperlink.
  Assert<Equal<t.CliFormat.Hyperlink.Fn, ExpectedHyperlink>>,
  Assert<
    Exact6<
      t.CliFormat.Hyperlink.Fn,
      t.Cli.Fmt.Hyperlink.Fn,
      CliFormatFromT.Hyperlink.Fn,
      CliFormatFromTypes.Hyperlink.Fn,
      CliFromT.Fmt.Hyperlink.Fn,
      CliFromTypes.Fmt.Hyperlink.Fn
    >
  >,

  // Header.
  Assert<Equal<t.CliFormatHeader.PackageIdentity, ExpectedHeaderPackageIdentity>>,
  Assert<Equal<t.CliFormatHeader.Lib, ExpectedHeaderLib>>,
  Assert<Equal<t.CliFormatHeader.Options, ExpectedHeaderOptions>>,
  Assert<
    Exact6<
      t.CliFormatHeader.PackageIdentity,
      t.Cli.Fmt.Header.PackageIdentity,
      CliFormatHeaderFromT.PackageIdentity,
      CliFormatHeaderFromTypes.PackageIdentity,
      CliFromT.Fmt.Header.PackageIdentity,
      CliFromTypes.Fmt.Header.PackageIdentity
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHeader.Lib,
      t.Cli.Fmt.Header.Lib,
      CliFormatHeaderFromT.Lib,
      CliFormatHeaderFromTypes.Lib,
      CliFromT.Fmt.Header.Lib,
      CliFromTypes.Fmt.Header.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHeader.Options,
      t.Cli.Fmt.Header.Options,
      CliFormatHeaderFromT.Options,
      CliFormatHeaderFromTypes.Options,
      CliFromT.Fmt.Header.Options,
      CliFromTypes.Fmt.Header.Options
    >
  >,

  // Help.
  Assert<
    Exact6<
      t.CliFormatHelp.Lib,
      t.Cli.Fmt.Help.Lib,
      CliFormatHelpFromT.Lib,
      CliFormatHelpFromTypes.Lib,
      CliFromT.Fmt.Help.Lib,
      CliFromTypes.Fmt.Help.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.Input,
      t.Cli.Fmt.Help.Input,
      CliFormatHelpFromT.Input,
      CliFormatHelpFromTypes.Input,
      CliFromT.Fmt.Help.Input,
      CliFromTypes.Fmt.Help.Input
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.InputBase,
      t.Cli.Fmt.Help.InputBase,
      CliFormatHelpFromT.InputBase,
      CliFormatHelpFromTypes.InputBase,
      CliFromT.Fmt.Help.InputBase,
      CliFromTypes.Fmt.Help.InputBase
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.InputSections,
      t.Cli.Fmt.Help.InputSections,
      CliFormatHelpFromT.InputSections,
      CliFormatHelpFromTypes.InputSections,
      CliFromT.Fmt.Help.InputSections,
      CliFromTypes.Fmt.Help.InputSections
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.InputShorthand,
      t.Cli.Fmt.Help.InputShorthand,
      CliFormatHelpFromT.InputShorthand,
      CliFormatHelpFromTypes.InputShorthand,
      CliFromT.Fmt.Help.InputShorthand,
      CliFromTypes.Fmt.Help.InputShorthand
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.Section,
      t.Cli.Fmt.Help.Section,
      CliFormatHelpFromT.Section,
      CliFormatHelpFromTypes.Section,
      CliFromT.Fmt.Help.Section,
      CliFromTypes.Fmt.Help.Section
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.Pair,
      t.Cli.Fmt.Help.Pair,
      CliFormatHelpFromT.Pair,
      CliFormatHelpFromTypes.Pair,
      CliFromT.Fmt.Help.Pair,
      CliFromTypes.Fmt.Help.Pair
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.Option,
      t.Cli.Fmt.Help.Option,
      CliFormatHelpFromT.Option,
      CliFormatHelpFromTypes.Option,
      CliFromT.Fmt.Help.Option,
      CliFromTypes.Fmt.Help.Option
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.Tone,
      t.Cli.Fmt.Help.Tone,
      CliFormatHelpFromT.Tone,
      CliFormatHelpFromTypes.Tone,
      CliFromT.Fmt.Help.Tone,
      CliFromTypes.Fmt.Help.Tone
    >
  >,
  Assert<
    Exact6<
      t.CliFormatHelp.LayoutOptions,
      t.Cli.Fmt.Help.LayoutOptions,
      CliFormatHelpFromT.LayoutOptions,
      CliFormatHelpFromTypes.LayoutOptions,
      CliFromT.Fmt.Help.LayoutOptions,
      CliFromTypes.Fmt.Help.LayoutOptions
    >
  >,

  // Commit.
  Assert<
    Exact6<
      t.CliFormatCommit.Lib,
      t.Cli.Fmt.Commit.Lib,
      CliFormatCommitFromT.Lib,
      CliFormatCommitFromTypes.Lib,
      CliFromT.Fmt.Commit.Lib,
      CliFromTypes.Fmt.Commit.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormatCommit.Options,
      t.Cli.Fmt.Commit.Options,
      CliFormatCommitFromT.Options,
      CliFormatCommitFromTypes.Options,
      CliFromT.Fmt.Commit.Options,
      CliFromTypes.Fmt.Commit.Options
    >
  >,
  Assert<
    Exact6<
      t.CliFormatCommit.Title,
      t.Cli.Fmt.Commit.Title,
      CliFormatCommitFromT.Title,
      CliFormatCommitFromTypes.Title,
      CliFromT.Fmt.Commit.Title,
      CliFromTypes.Fmt.Commit.Title
    >
  >,
  Assert<
    Exact6<
      t.CliFormatCommit.Text,
      t.Cli.Fmt.Commit.Text,
      CliFormatCommitFromT.Text,
      CliFormatCommitFromTypes.Text,
      CliFromT.Fmt.Commit.Text,
      CliFromTypes.Fmt.Commit.Text
    >
  >,

  // Text operation and policy contracts.
  Assert<Equal<t.CliFormatText.Lib, ExpectedTextLib>>,
  Assert<Equal<t.CliFormatText.Width.Lib, ExpectedTextWidthLib>>,
  Assert<Equal<t.CliFormatText.Wrap.Lib, ExpectedTextWrapLib>>,
  Assert<
    Exact6<
      t.CliFormatText.Lib,
      t.Cli.Fmt.Text.Lib,
      CliFormatTextFromT.Lib,
      CliFormatTextFromTypes.Lib,
      CliFromT.Fmt.Text.Lib,
      CliFromTypes.Fmt.Text.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Width.Lib,
      t.Cli.Fmt.Text.Width.Lib,
      CliFormatTextFromT.Width.Lib,
      CliFormatTextFromTypes.Width.Lib,
      CliFromT.Fmt.Text.Width.Lib,
      CliFromTypes.Fmt.Text.Width.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Wrap.Lib,
      t.Cli.Fmt.Text.Wrap.Lib,
      CliFormatTextFromT.Wrap.Lib,
      CliFormatTextFromTypes.Wrap.Lib,
      CliFromT.Fmt.Text.Wrap.Lib,
      CliFromTypes.Fmt.Text.Wrap.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Width.Fit.Options,
      t.Cli.Fmt.Text.Width.Fit.Options,
      CliFormatTextFromT.Width.Fit.Options,
      CliFormatTextFromTypes.Width.Fit.Options,
      CliFromT.Fmt.Text.Width.Fit.Options,
      CliFromTypes.Fmt.Text.Width.Fit.Options
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Wrap.Options,
      t.Cli.Fmt.Text.Wrap.Options,
      CliFormatTextFromT.Wrap.Options,
      CliFormatTextFromTypes.Wrap.Options,
      CliFromT.Fmt.Text.Wrap.Options,
      CliFromTypes.Fmt.Text.Wrap.Options
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Wrap.Preserve,
      t.Cli.Fmt.Text.Wrap.Preserve,
      CliFormatTextFromT.Wrap.Preserve,
      CliFormatTextFromTypes.Wrap.Preserve,
      CliFromT.Fmt.Text.Wrap.Preserve,
      CliFromTypes.Fmt.Text.Wrap.Preserve
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Wrap.PreserveFn,
      t.Cli.Fmt.Text.Wrap.PreserveFn,
      CliFormatTextFromT.Wrap.PreserveFn,
      CliFormatTextFromTypes.Wrap.PreserveFn,
      CliFromT.Fmt.Text.Wrap.PreserveFn,
      CliFromTypes.Fmt.Text.Wrap.PreserveFn
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Ellipsize.Options,
      t.Cli.Fmt.Text.Ellipsize.Options,
      CliFormatTextFromT.Ellipsize.Options,
      CliFormatTextFromTypes.Ellipsize.Options,
      CliFromT.Fmt.Text.Ellipsize.Options,
      CliFromTypes.Fmt.Text.Ellipsize.Options
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Ellipsize.Parts,
      t.Cli.Fmt.Text.Ellipsize.Parts,
      CliFormatTextFromT.Ellipsize.Parts,
      CliFormatTextFromTypes.Ellipsize.Parts,
      CliFromT.Fmt.Text.Ellipsize.Parts,
      CliFromTypes.Fmt.Text.Ellipsize.Parts
    >
  >,
  Assert<
    Exact6<
      t.CliFormatText.Ellipsize.Render,
      t.Cli.Fmt.Text.Ellipsize.Render,
      CliFormatTextFromT.Ellipsize.Render,
      CliFormatTextFromTypes.Ellipsize.Render,
      CliFromT.Fmt.Text.Ellipsize.Render,
      CliFromTypes.Fmt.Text.Ellipsize.Render
    >
  >,

  // Base formatter sub-libraries.
  Assert<
    Exact6<
      t.CliFormat.Path.Lib,
      t.Cli.Fmt.Path.Lib,
      CliFormatFromT.Path.Lib,
      CliFormatFromTypes.Path.Lib,
      CliFromT.Fmt.Path.Lib,
      CliFromTypes.Fmt.Path.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.Path.FormatOptions,
      t.Cli.Fmt.Path.FormatOptions,
      CliFormatFromT.Path.FormatOptions,
      CliFormatFromTypes.Path.FormatOptions,
      CliFromT.Fmt.Path.FormatOptions,
      CliFromTypes.Fmt.Path.FormatOptions
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.Path.TtyOptions,
      t.Cli.Fmt.Path.TtyOptions,
      CliFormatFromT.Path.TtyOptions,
      CliFormatFromTypes.Path.TtyOptions,
      CliFromT.Fmt.Path.TtyOptions,
      CliFromTypes.Fmt.Path.TtyOptions
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.ServiceUrl.Lib,
      t.Cli.Fmt.ServiceUrl.Lib,
      CliFormatFromT.ServiceUrl.Lib,
      CliFormatFromTypes.ServiceUrl.Lib,
      CliFromT.Fmt.ServiceUrl.Lib,
      CliFromTypes.Fmt.ServiceUrl.Lib
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.ServiceUrl.Part,
      t.Cli.Fmt.ServiceUrl.Part,
      CliFormatFromT.ServiceUrl.Part,
      CliFormatFromTypes.ServiceUrl.Part,
      CliFromT.Fmt.ServiceUrl.Part,
      CliFromTypes.Fmt.ServiceUrl.Part
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.ServiceUrl.DisplayHostname.Method,
      t.Cli.Fmt.ServiceUrl.DisplayHostname.Method,
      CliFormatFromT.ServiceUrl.DisplayHostname.Method,
      CliFormatFromTypes.ServiceUrl.DisplayHostname.Method,
      CliFromT.Fmt.ServiceUrl.DisplayHostname.Method,
      CliFromTypes.Fmt.ServiceUrl.DisplayHostname.Method
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.ServiceUrl.DisplayHostname.Options,
      t.Cli.Fmt.ServiceUrl.DisplayHostname.Options,
      CliFormatFromT.ServiceUrl.DisplayHostname.Options,
      CliFormatFromTypes.ServiceUrl.DisplayHostname.Options,
      CliFromT.Fmt.ServiceUrl.DisplayHostname.Options,
      CliFromTypes.Fmt.ServiceUrl.DisplayHostname.Options
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.ServiceUrl.Parts.Options,
      t.Cli.Fmt.ServiceUrl.Parts.Options,
      CliFormatFromT.ServiceUrl.Parts.Options,
      CliFormatFromTypes.ServiceUrl.Parts.Options,
      CliFromT.Fmt.ServiceUrl.Parts.Options,
      CliFromTypes.Fmt.ServiceUrl.Parts.Options
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.ServiceUrl.Format.Options,
      t.Cli.Fmt.ServiceUrl.Format.Options,
      CliFormatFromT.ServiceUrl.Format.Options,
      CliFormatFromTypes.ServiceUrl.Format.Options,
      CliFromT.Fmt.ServiceUrl.Format.Options,
      CliFromTypes.Fmt.ServiceUrl.Format.Options
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.ServiceUrl.FormatList.Method,
      t.Cli.Fmt.ServiceUrl.FormatList.Method,
      CliFormatFromT.ServiceUrl.FormatList.Method,
      CliFormatFromTypes.ServiceUrl.FormatList.Method,
      CliFromT.Fmt.ServiceUrl.FormatList.Method,
      CliFromTypes.Fmt.ServiceUrl.FormatList.Method
    >
  >,
  Assert<
    Exact6<
      t.CliFormat.Tree.Lib,
      t.Cli.Fmt.Tree.Lib,
      CliFormatFromT.Tree.Lib,
      CliFormatFromTypes.Tree.Lib,
      CliFromT.Fmt.Tree.Lib,
      CliFromTypes.Fmt.Tree.Lib
    >
  >,
];

describe('Cli.Fmt: canonical formatter type namespaces', () => {
  it('projects one exact base formatter contract through every public type entry', () => {
    expectTypeOf(Fmt).toEqualTypeOf<t.CliFormat.Lib>();
    expectTypeOf(Fmt).toEqualTypeOf<t.Cli.Fmt.Lib>();
    expectTypeOf(Fmt).toEqualTypeOf<CliFormatFromT.Lib>();
    expectTypeOf(Fmt).toEqualTypeOf<CliFormatFromTypes.Lib>();

    expectTypeOf(Fmt.Header).toEqualTypeOf<t.CliFormatHeader.Lib>();
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
