import { describe, expect, it } from '../-test.ts';
import { Cli } from '../m.core/m.Cli/mod.ts';
import { Fmt } from '../m.core/m.Fmt/mod.ts';
import { Code, Fmt as CodeFmt } from '../m.core/m.Fmt.Code/mod.ts';
import { Input } from '../m.core/m.Input/mod.ts';
import { MenuResultKind } from '../m.core/m.Input/t.menu.ts';
import { Screen } from '../m.core/m.Screen/mod.ts';
import { ScreenMeasure } from '../m.core/m.Screen/u.measure.ts';
import { Shell } from '../m.shell/mod.ts';
import { FakeSpinner } from '../m.testing/mod.ts';

describe('cli namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      Cli,
      Cli.Args,
      Cli.Path,
      Cli.Table,
      Cli.Spinner,
      Cli.Fmt,
      Cli.Is,
      Cli.Keyboard,
      Cli.Screen,
      Cli.Screen.Dock,
      Cli.Input,
      Cli.Input.Text,
      Cli.Input.Confirm,
      Cli.Input.Number,
      Cli.Input.Secret,
      Cli.Input.Toggle,
      Cli.Input.MultiText,
      Cli.Input.Select,
      Cli.Input.Checkbox,
      Cli.Prompt,
      Fmt,
      Fmt.Header,
      Fmt.Commit,
      Fmt.Help,
      Fmt.Text,
      Fmt.Text.Width,
      Fmt.Text.Wrap,
      Fmt.Chapters,
      Fmt.Chapters.Book,
      Fmt.Chapters.Resources,
      Fmt.Tree,
      Fmt.Path,
      Fmt.ServiceUrl,
      Code,
      CodeFmt,
      Input,
      Screen,
      MenuResultKind,
      ScreenMeasure,
      Shell,
      Shell.Alias,
      Shell.Path,
      Shell.Block,
      Shell.Plan,
      FakeSpinner,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
